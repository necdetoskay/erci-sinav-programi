import { Banner, BannerClick, sequelize } from '../models/index.js';
import logger from '../utils/logger.js';
import { Op } from 'sequelize';
import fs from 'fs/promises';
import path from 'path';

// IP adresini anonimleştirme fonksiyonu (GDPR)
const anonymizeIP = (ip) => {
  if (!ip) return null;
  // IPv4 için son okteti sıfırla
  if (ip.includes('.')) {
    return ip.replace(/\d+$/, '0');
  }
  // IPv6 için son 16 biti sıfırla
  if (ip.includes(':')) {
    const parts = ip.split(':');
    parts[parts.length - 1] = '0000';
    return parts.join(':');
  }
  return ip;
};

// Tarayıcı ve cihaz bilgisini çıkarma
const parseUserAgent = (userAgent) => {
  if (!userAgent) return 'unknown';
  
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet/i.test(userAgent)) return 'tablet';
  if (/ipad/i.test(userAgent)) return 'tablet';
  
  return 'desktop';
};

// Aktif banner'ları getirme
export const getActiveBanners = async (req, res) => {
  try {
    const currentDate = new Date();
    
    const banners = await Banner.findAll({
      where: {
        isActive: true,
        startDate: {
          [Op.lte]: currentDate
        },
        [Op.or]: [
          { endDate: null },
          { endDate: { [Op.gte]: currentDate } }
        ]
      },
      order: [
        ['order', 'ASC'],
        ['created_at', 'DESC']
      ]
    });
    
    logger.info(`${banners.length} aktif banner bulundu`);
    
    return res.status(200).json({
      success: true,
      message: 'Aktif banner\'lar başarıyla getirildi',
      data: banners
    });
  } catch (error) {
    logger.error('Bannerlar getirilirken hata oluştu:', error);
    return res.status(500).json({
      success: false,
      message: 'Bannerlar getirilirken bir hata oluştu',
      error: error.message
    });
  }
};

// Banner tıklama kaydı
export const recordBannerClick = async (req, res) => {
  try {
    const { bannerId } = req.params;
    const { referrer } = req.body;
    const userAgent = req.headers['user-agent'];
    const ip = req.ip || req.connection.remoteAddress;
    
    // Banner'ın var olup olmadığını kontrol et
    const banner = await Banner.findByPk(bannerId);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner bulunamadı'
      });
    }
    
    // Tıklama kaydını oluştur
    await BannerClick.create({
      bannerId,
      timestamp: new Date(),
      userAgent,
      ipAddress: anonymizeIP(ip),
      referrer,
      deviceType: parseUserAgent(userAgent)
    });
    
    logger.info(`Banner tıklaması kaydedildi: ${bannerId}`);
    
    return res.status(201).json({
      success: true,
      message: 'Banner tıklaması başarıyla kaydedildi'
    });
  } catch (error) {
    logger.error('Banner tıklaması kaydedilirken hata oluştu:', error);
    return res.status(500).json({
      success: false,
      message: 'Banner tıklaması kaydedilirken bir hata oluştu',
      error: error.message
    });
  }
};

// Banner istatistiklerini getirme
export const getBannerStats = async (req, res) => {
  try {
    const { bannerId, startDate, endDate } = req.query;
    
    // Tarih filtresi oluştur
    const dateFilter = {};
    if (startDate) {
      dateFilter.timestamp = { ...dateFilter.timestamp, [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      dateFilter.timestamp = { ...dateFilter.timestamp, [Op.lte]: new Date(endDate) };
    }
    
    // Banner ID filtresi
    const whereClause = bannerId ? { ...dateFilter, bannerId } : dateFilter;
    
    // Toplam tıklama sayısı
    const totalClicks = await BannerClick.count({ where: whereClause });
    
    // Cihaz türüne göre dağılım
    const deviceStats = await BannerClick.findAll({
      attributes: ['deviceType', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      where: whereClause,
      group: ['deviceType'],
      raw: true
    });
    
    // Saatlere göre dağılım
    const hourlyStats = await BannerClick.findAll({
      attributes: [
        [sequelize.fn('EXTRACT', sequelize.literal('HOUR FROM timestamp')), 'hour'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: [sequelize.fn('EXTRACT', sequelize.literal('HOUR FROM timestamp'))],
      order: [[sequelize.fn('EXTRACT', sequelize.literal('HOUR FROM timestamp')), 'ASC']],
      raw: true
    });
    
    return res.status(200).json({
      success: true,
      message: 'Banner istatistikleri başarıyla getirildi',
      data: {
        totalClicks,
        deviceBreakdown: deviceStats,
        hourlyDistribution: hourlyStats
      }
    });
  } catch (error) {
    logger.error('Banner istatistikleri getirilirken hata oluştu:', error);
    return res.status(500).json({
      success: false,
      message: 'Banner istatistikleri getirilirken bir hata oluştu',
      error: error.message
    });
  }
};

// Admin: Tüm banner'ları listeleme
export const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.findAll({
      order: [
        ['order', 'ASC'],
        ['created_at', 'DESC']
      ]
    });
    
    return res.status(200).json({
      success: true,
      message: 'Tüm banner\'lar başarıyla getirildi',
      data: banners
    });
  } catch (error) {
    logger.error('Bannerlar getirilirken hata oluştu:', error);
    return res.status(500).json({
      success: false,
      message: 'Bannerlar getirilirken bir hata oluştu',
      error: error.message
    });
  }
};

// Admin: Banner oluşturma
export const createBanner = async (req, res) => {
  try {
    const {
      imageUrl,
      order,
      startDate,
      endDate,
      targetUrl,
      isActive,
      metadata
    } = req.body;
    
    // Dosya yükleme middleware'inden gelen dosya var mı kontrol et
    const finalImageUrl = req.processedImage ? req.body.imageUrl : imageUrl;
    
    if (!finalImageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Banner resmi URL\'si gereklidir'
      });
    }
    
    // Metadata nesnesini hazırla
    const finalMetadata = req.processedImage 
      ? { 
          ...req.body.metadata,
          ...metadata
        } 
      : metadata || {};
    
    // Banner oluştur
    const banner = await Banner.create({
      imageUrl: finalImageUrl,
      order: order || 0,
      startDate: startDate || new Date(),
      endDate,
      targetUrl: targetUrl || '#',
      isActive: isActive !== undefined ? isActive : true,
      metadata: finalMetadata
    });
    
    logger.info(`Yeni banner oluşturuldu: ${banner.id}`);
    
    return res.status(201).json({
      success: true,
      message: 'Banner başarıyla oluşturuldu',
      data: banner
    });
  } catch (error) {
    logger.error('Banner oluşturulurken hata oluştu:', error);
    return res.status(500).json({
      success: false,
      message: 'Banner oluşturulurken bir hata oluştu',
      error: error.message
    });
  }
};

// Admin: Banner güncelleme
export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      imageUrl,
      order,
      startDate,
      endDate,
      targetUrl,
      isActive,
      metadata
    } = req.body;
    
    const banner = await Banner.findByPk(id);
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner bulunamadı'
      });
    }
    
    // Güncellenecek alanları belirle
    const updateData = {};
    if (imageUrl !== undefined || req.processedImage) updateData.imageUrl = req.processedImage ? req.body.imageUrl : imageUrl;
    if (order !== undefined) updateData.order = order;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (targetUrl !== undefined) updateData.targetUrl = targetUrl;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Metadata güncelleme
    if (metadata !== undefined || req.processedImage) {
      // İşlenen görüntü metadata'sı varsa birleştir
      updateData.metadata = req.processedImage 
        ? { ...banner.metadata, ...metadata, ...req.body.metadata }
        : { ...banner.metadata, ...metadata };
    }
    
    // Eğer yeni bir resim yükleniyorsa ve eski resim varsa eski resmi sil
    if (req.processedImage && banner.imageUrl && banner.imageUrl.startsWith('/api/uploads/banners/')) {
      try {
        const oldFilename = banner.imageUrl.split('/').pop();
        const oldFilePath = path.join(process.cwd(), 'uploads', 'banners', oldFilename);
        await fs.access(oldFilePath); // Dosya var mı kontrol et
        await fs.unlink(oldFilePath); // Varsa sil
        logger.info(`Eski banner resmi silindi: ${oldFilename}`);
      } catch (err) {
        logger.warn(`Eski resim silinirken hata oluştu (mevcut olmayabilir): ${err.message}`);
      }
    }
    
    await banner.update(updateData);
    
    logger.info(`Banner güncellendi: ${id}`);
    
    return res.status(200).json({
      success: true,
      message: 'Banner başarıyla güncellendi',
      data: banner
    });
  } catch (error) {
    logger.error('Banner güncellenirken hata oluştu:', error);
    return res.status(500).json({
      success: false,
      message: 'Banner güncellenirken bir hata oluştu',
      error: error.message
    });
  }
};

// Admin: Banner silme
export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    
    const banner = await Banner.findByPk(id);
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner bulunamadı'
      });
    }
    
    // Eğer banner dosyası uploads klasöründe ise dosyayı da sil
    if (banner.imageUrl && banner.imageUrl.startsWith('/api/uploads/banners/')) {
      try {
        const filename = banner.imageUrl.split('/').pop();
        const filePath = path.join(process.cwd(), 'uploads', 'banners', filename);
        await fs.access(filePath); // Dosya var mı kontrol et
        await fs.unlink(filePath); // Varsa sil
        logger.info(`Banner resmi silindi: ${filename}`);
      } catch (err) {
        logger.warn(`Banner resmi silinirken hata oluştu (mevcut olmayabilir): ${err.message}`);
      }
    }
    
    await banner.destroy();
    
    logger.info(`Banner silindi: ${id}`);
    
    return res.status(200).json({
      success: true,
      message: 'Banner başarıyla silindi'
    });
  } catch (error) {
    logger.error('Banner silinirken hata oluştu:', error);
    return res.status(500).json({
      success: false,
      message: 'Banner silinirken bir hata oluştu',
      error: error.message
    });
  }
}; 