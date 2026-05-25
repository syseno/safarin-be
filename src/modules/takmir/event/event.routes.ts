import { Router } from 'express';
import { EventController } from './event.controller';
import { uploadPublic } from '../../../middleware/upload.middleware';

const router = Router({ mergeParams: true });
const controller = new EventController();

router.post('/upload', uploadPublic.single('image'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    const relativePath = `/uploads/public/${req.file.filename}`;
    res.status(200).json({
      success: true,
      message: 'Poster uploaded successfully.',
      data: { imageUrl: relativePath }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', controller.create);
router.get('/', controller.getList);
router.get('/:id', controller.getDetail);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;

