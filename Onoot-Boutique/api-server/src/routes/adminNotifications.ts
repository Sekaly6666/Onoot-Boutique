import { Router } from 'express';
import { AdminNotification } from '../models/AdminNotification';
import { requireAdmin } from '../middlewares/auth';
import { logger } from '../lib/logger';

const router = Router();

router.use(requireAdmin);

// GET all admin notifications
router.get('/', async (req, res): Promise<void> => {
  try {
    const notifications = await AdminNotification.find().sort({ createdAt: -1 }).limit(100);
    res.json(notifications.map((n: any) => ({
      id: n._id,
      type: n.type,
      title: n.title,
      desc: n.desc,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })));
  } catch (err) {
    logger.error({ err }, 'Failed to fetch admin notifications');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST mark all as read
router.post('/mark-read', async (req, res): Promise<void> => {
  try {
    await AdminNotification.updateMany({ read: false }, { $set: { read: true } });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    logger.error({ err }, 'Failed to mark notifications as read');
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE a notification
router.delete('/:id', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await AdminNotification.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    logger.error({ err }, 'Failed to delete notification');
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
