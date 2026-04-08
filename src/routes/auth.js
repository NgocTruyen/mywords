import express from 'express';
import * as controller from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', controller.register);
router.post('/login', controller.login);

// Protected routes (require authentication)
router.get('/me', authenticateToken, controller.getMe);
router.put('/password', authenticateToken, controller.changePassword);
router.delete('/account', authenticateToken, controller.deleteAccount);

export default router;
