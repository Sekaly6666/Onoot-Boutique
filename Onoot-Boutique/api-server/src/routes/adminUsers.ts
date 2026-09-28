import { Router } from 'express';
import { User } from '../models/User';
import { requireAdmin } from '../middlewares/auth';
import { logger } from '../lib/logger';

const router = Router();

// All routes are protected – only admin can access
router.use(requireAdmin);

// GET all users (with optional query params for search/filter)
router.get('/', async (req, res): Promise<void> => {
  try {
    const { search, role, status } = req.query as any;
    const filter: any = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }];
    }
    if (role) filter.role = role;
    if (status) filter.status = status;

    const users = await User.find(filter).sort({ createdAt: -1 });
    const result = users.map((user: any) => {
      const lastActiveDate = user.lastActive || user.lastLogin;
      const isOnline = lastActiveDate ? (Date.now() - new Date(lastActiveDate).getTime() < 15 * 60 * 1000) : false;
      const obj = user.toObject ? user.toObject() : user;
      return {
        ...obj,
        id: user._id,
        _id: user._id,
        name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email,
        isOnline,
        createdAt: user.createdAt || user.joinDate,
      };
    });
    res.json(result);
  } catch (err) {
    logger.error({ err }, 'Failed to fetch users');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST create a new user
router.post('/', async (req, res): Promise<void> => {
  try {
    const { firstName, lastName, email, phone, role, status } = req.body;
    const newUser = new User({ firstName, lastName, email, phone, role, status });
    await newUser.save();
    res.status(201).json(newUser);
    } catch (err) {
    logger.error({ err }, 'Failed to create user');
    // Return detailed error message if available
    const message = (err as any)?.message || 'Invalid data or duplicate email';
    res.status(400).json({ error: message });
  }
});

// PUT update a user
router.put('/:id', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(updated);
  } catch (err) {
    logger.error({ err }, 'Failed to update user');
    res.status(400).json({ error: 'Invalid update' });
  }
});

// DELETE a user
router.delete('/:id', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ message: 'User deleted' });
  } catch (err) {
    logger.error({ err }, 'Failed to delete user');
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
