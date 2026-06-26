import express from 'express';
import { allMessages, sendMessage, editMessage, deleteMessage } from '../controllers/message.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/:chatId').get(protect, allMessages);
router.route('/').post(protect, sendMessage);
router.route('/:id').put(protect, editMessage);
router.route('/:id').delete(protect, deleteMessage);

export default router;
