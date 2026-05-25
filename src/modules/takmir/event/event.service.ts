import crypto from 'crypto';
import prisma from '../../../config/database';
import { CreateEventDto, UpdateEventDto } from './event.dto';

export class EventService {
  async createEvent(masjidId: string, data: CreateEventDto) {
    if (!data.recurrenceType || data.recurrenceType === 'NONE') {
      return prisma.event.create({
        data: {
          title: data.title,
          description: data.description,
          date: new Date(data.date),
          startTime: data.startTime,
          endTime: data.endTime,
          location: data.location || null,
          imageUrl: data.imageUrl || null,
          masjidId,
        },
      });
    }

    // Google Calendar-Style Recurrence pre-generation
    const dates: Date[] = [];
    const startDate = new Date(data.date);
    dates.push(new Date(startDate));

    const recurrenceInterval = data.recurrenceInterval || 1;
    const recurrenceEnd = data.recurrenceEnd ? new Date(data.recurrenceEnd) : null;

    // Search window limit: max 5 years into the future to avoid any infinite loop
    const searchLimit = new Date(startDate);
    searchLimit.setFullYear(searchLimit.getFullYear() + 5);

    if (data.recurrenceType === 'DAILY') {
      let current = new Date(startDate);
      while (dates.length < 730) {
        current.setDate(current.getDate() + recurrenceInterval);
        if (recurrenceEnd && current > recurrenceEnd) break;
        if (current > searchLimit) break;
        dates.push(new Date(current));
      }
    } else if (data.recurrenceType === 'WEEKLY') {
      const targetDays = data.recurrenceDays
        ? data.recurrenceDays.split(',').map(Number)
        : [startDate.getDay()];

      const getWeekStart = (d: Date) => {
        const temp = new Date(d);
        const day = temp.getDay();
        const diff = temp.getDate() - day; // adjust to Sunday
        const result = new Date(temp.setDate(diff));
        result.setHours(0, 0, 0, 0);
        return result;
      };

      const startWeekStart = getWeekStart(new Date(startDate));
      let dayCursor = new Date(startDate);
      dayCursor.setDate(dayCursor.getDate() + 1);

      while (dates.length < 730) {
        if (recurrenceEnd && dayCursor > recurrenceEnd) break;
        if (dayCursor > searchLimit) break;

        const currentWeekStart = getWeekStart(dayCursor);
        const msDiff = currentWeekStart.getTime() - startWeekStart.getTime();
        const weeksDiff = Math.round(msDiff / (7 * 24 * 60 * 60 * 1000));

        if (weeksDiff % recurrenceInterval === 0) {
          if (targetDays.includes(dayCursor.getDay())) {
            dates.push(new Date(dayCursor));
          }
        }
        dayCursor.setDate(dayCursor.getDate() + 1);
      }
    } else if (data.recurrenceType === 'MONTHLY') {
      const startDay = startDate.getDate();
      let monthOffset = 0;
      while (dates.length < 730) {
        monthOffset += recurrenceInterval;
        let nextDate = new Date(startDate);
        nextDate.setMonth(nextDate.getMonth() + monthOffset);
        
        if (nextDate.getDate() !== startDay) {
          nextDate.setDate(0); // Adjust to last day of month if overflowed
        }

        if (recurrenceEnd && nextDate > recurrenceEnd) break;
        if (nextDate > searchLimit) break;
        dates.push(new Date(nextDate));
      }
    }

    const groupId = crypto.randomUUID();
    const eventRecords = dates.map((d, index) => ({
      title: data.title,
      description: data.description,
      date: d,
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location || null,
      imageUrl: data.imageUrl || null,
      groupId,
      isException: false,
      recurrenceType: data.recurrenceType,
      recurrenceInterval,
      recurrenceEnd: recurrenceEnd || null,
      recurrenceDays: data.recurrenceDays || null,
      masjidId,
    }));

    // Perform database insertions in a single transaction
    const firstEvent = await prisma.event.create({
      data: eventRecords[0],
    });

    if (eventRecords.length > 1) {
      const remainingRecords = eventRecords.slice(1);
      await prisma.event.createMany({
        data: remainingRecords,
      });
    }

    return firstEvent;
  }

  async updateEvent(masjidId: string, eventId: string, data: UpdateEventDto) {
    const event = await prisma.event.findFirst({
      where: { id: eventId, masjidId },
    });

    if (!event) {
      throw new Error('Event not found in this masjid.');
    }

    if (data.updateType === 'ALL' && event.groupId) {
      // Update all non-exception events in the series
      await prisma.event.updateMany({
        where: {
          groupId: event.groupId,
          masjidId,
          isException: false,
        },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.startTime !== undefined && { startTime: data.startTime }),
          ...(data.endTime !== undefined && { endTime: data.endTime }),
          ...(data.location !== undefined && { location: data.location }),
          ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        },
      });

      // Update the targeted event (even if it was marked as exception, it is being explicitly edited now)
      return prisma.event.update({
        where: { id: eventId },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.startTime !== undefined && { startTime: data.startTime }),
          ...(data.endTime !== undefined && { endTime: data.endTime }),
          ...(data.location !== undefined && { location: data.location }),
          ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        },
      });
    }

    // Single occurrence edit: sets isException to true to protect from bulk series changes
    return prisma.event.update({
      where: { id: eventId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.date !== undefined && { date: new Date(data.date) }),
        ...(data.startTime !== undefined && { startTime: data.startTime }),
        ...(data.endTime !== undefined && { endTime: data.endTime }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(event.groupId && { isException: true }),
      },
    });
  }

  async deleteEvent(masjidId: string, eventId: string, deleteType: 'SINGLE' | 'ALL' = 'SINGLE') {
    const event = await prisma.event.findFirst({
      where: { id: eventId, masjidId },
    });

    if (!event) {
      throw new Error('Event not found in this masjid.');
    }

    if (deleteType === 'ALL' && event.groupId) {
      return prisma.event.deleteMany({
        where: { groupId: event.groupId, masjidId },
      });
    }

    return prisma.event.delete({ where: { id: eventId } });
  }

  async getEventList(masjidId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      prisma.event.findMany({
        where: { masjidId },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.event.count({ where: { masjidId } }),
    ]);

    return {
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEventDetail(masjidId: string, eventId: string) {
    const event = await prisma.event.findFirst({
      where: { id: eventId, masjidId },
    });

    if (!event) {
      throw new Error('Event not found.');
    }

    return event;
  }
}
