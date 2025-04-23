import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { processBannerImage } from '../utils/image-processor.js';

// Yükleme dizinlerini oluştur
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const BANNER_DIR = path.join(UPLOAD_DIR, 'banners');

// Dizinlerin varlığını kontrol et ve oluştur
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(BANNER_DIR)) {
  fs.mkdirSync(BANNER_DIR, { recursive: true });
}

// Storage konfigürasyonu
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, BANNER_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const fileExt = path.extname(file.originalname).toLowerCase();
    const safeFilename = `${uniqueId}${fileExt}`;
    cb(null, safeFilename);
  }
});

// Dosya filtresi
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Desteklenmeyen dosya formatı! Sadece resimler yüklenebilir (JPEG, PNG, GIF, WEBP).'));
  }
};

// Banner yükleme için multer konfigürasyonu
export const bannerUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: fileFilter,
});

// Banner işleme middleware
export const processBanner = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const filePath = req.file.path;
    const filename = path.parse(req.file.filename).name;

    // Banner görüntüsünü işle
    const processedImage = await processBannerImage(filePath, {
      targetWidth: 1900,
      targetAspectRatio: 16/9,
      quality: 85,
      outputFormat: 'webp',
      outputPath: BANNER_DIR,
      filename: filename,
      forceResize: true
    });

    // Artık original dosyayı silebiliriz (webp formatına dönüştürüldü)
    if (path.extname(filePath).toLowerCase() !== '.webp') {
      fs.unlinkSync(filePath);
    }

    // İşlenmiş resim bilgilerini request'e ekle
    req.processedImage = processedImage;
    req.body.imageUrl = `/api/uploads/banners/${filename}.webp`;
    req.body.metadata = {
      ...req.body.metadata,
      dimensions: {
        width: processedImage.outputWidth,
        height: processedImage.outputHeight,
        aspectRatio: '16:9'
      }
    };

    next();
  } catch (error) {
    console.error('Resim işleme hatası:', error);
    return res.status(400).json({
      success: false,
      message: 'Resim işlenirken bir hata oluştu',
      error: error.message
    });
  }
}; 