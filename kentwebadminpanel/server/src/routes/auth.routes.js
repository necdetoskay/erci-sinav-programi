import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Herkese açık rotalar
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Korumalı rotalar - giriş yapılmış olması gerekir
router.use(protect);
router.get('/me', authController.getMe);
router.post('/logout', authController.logout);
router.patch('/update-password', authController.updatePassword);

export default router; 