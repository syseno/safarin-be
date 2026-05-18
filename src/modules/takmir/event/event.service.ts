import prisma from '../../../config/database';
import { CreateEventDto, UpdateEventDto } from './event.dto';

export class EventService {
  async createEvent(masjidId: string, data: CreateEventDto) {
    return prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location || null,
        masjidId,
      },
    });
  }

  async updateEvent(masjidId: string, eventId: string, data: UpdateEventDto) {
    const event = await prisma.event.findFirst({
      where: { id: eventId, masjidId },
    });

    if (!event) {
      throw new Error('Event not found in this masjid.');
    }

    return prisma.event.update({
      where: { id: eventId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.date !== undefined && { date: new Date(data.date) }),
        ...(data.startTime !== undefined && { startTime: data.startTime }),
        ...(data.endTime !== undefined && { endTime: data.endTime }),
        ...(data.location !== undefined && { location: data.location }),
      },
    });
  }

  async deleteEvent(masjidId: string, eventId: string) {
    const event = await prisma.event.findFirst({
      where: { id: eventId, masjidId },
    });

    if (!event) {
      throw new Error('Event not found in this masjid.');
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
