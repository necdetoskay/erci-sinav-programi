import express from 'express';
import { bannerUpload, processBanner } from '../middleware/upload.middleware.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';

const router = express.Router();

// Statik dosya sunma
router.get('/banners/:filename', (req, res) => {
  const filename = req.params.filename;
  res.sendFile(`uploads/banners/${filename}`, { root: process.cwd() });
});

// Banner resmi yükleme (admin yetkisi gerekiyor)
router.post('/banners',
  protect,
  restrictTo('admin'),
  bannerUpload.single('image'),
  processBanner,
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Resim dosyası yüklenmelidir'
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Resim başarıyla yüklendi ve işlendi',
      data: {
        imageUrl: req.body.imageUrl,
        dimensions: req.body.metadata?.dimensions || {},
        processedImage: req.processedImage
      }
    });
  }
);

// Kullanıcı profil resmi yükleme
router.post('/profile/:userId',
  protect,
  (req, res, next) => {
    // Kullanıcı sadece kendi profil resmini yükleyebilir veya admin yetkisi olmalı
    if (req.user.id === req.params.userId || req.user.roles.includes('admin')) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: 'Bu işlem için yetkiniz bulunmamaktadır'
    });
  },
  bannerUpload.single('image'),
  processBanner,
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Resim dosyası yüklenmelidir'
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Profil resmi başarıyla yüklendi',
      data: {
        imageUrl: req.body.imageUrl,
        dimensions: req.body.metadata?.dimensions || {},
        processedImage: req.processedImage
      }
    });
  }
);

export default router; 