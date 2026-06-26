import express from 'express';
const router = express.Router();
import { registerUser, loginUser, getProfile } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getProfile);

export default router;
