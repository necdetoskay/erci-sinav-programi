import { Router } from 'express';
import { protect, restrictTo, hasPermission } from '../middleware/auth.middleware.js';

const router = Router();

// Tüm kullanıcı rotaları için kimlik doğrulama gerekir
router.use(protect);

// Placeholder olarak basit bir rota bırakıyorum, gerçek uygulamada daha fazla rota eklenecektir
router.get('/profile', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Bu endpoint henüz uygulanmadı'
  });
});

export default router; 