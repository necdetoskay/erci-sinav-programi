import express from 'express';
import {
  getActiveBanners,
  recordBannerClick,
  getBannerStats,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner
} from '../controllers/banner.controller.js';
import { rateLimit } from 'express-rate-limit';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { bannerUpload, processBanner } from '../middleware/upload.middleware.js';

const router = express.Router();

// Rate limiter - tıklama endpoint'i için
const clickRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 dakika
  max: 10, // IP başına 10 istek
  message: {
    success: false,
    message: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin'
  }
});

// Public endpoints
router.get('/active', getActiveBanners);
router.post('/clicks/:bannerId', clickRateLimiter, recordBannerClick);

// Admin endpoints - auth middleware'le korunmalı
router.get('/', protect, restrictTo('admin'), getAllBanners);
router.get('/stats', protect, restrictTo('admin'), getBannerStats);

// Banner oluşturma - dosya yükleme olmadan
router.post('/', protect, restrictTo('admin'), createBanner);

// Banner oluşturma - dosya yükleme ile
router.post('/upload', 
  protect, 
  restrictTo('admin'),
  bannerUpload.single('image'),
  processBanner,
  createBanner
);

router.put('/:id', protect, restrictTo('admin'), updateBanner);
router.delete('/:id', protect, restrictTo('admin'), deleteBanner);

export default router; 