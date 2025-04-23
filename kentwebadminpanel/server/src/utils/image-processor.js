import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import logger from './logger.js';

/**
 * Banner resmini işler, optimize eder ve oranını kontrol eder
 * @param {string|buffer} input - Resim dosyası veya buffer
 * @param {object} options - İşleme seçenekleri
 * @returns {Promise<object>} İşlenmiş resim bilgileri
 */
export async function processBannerImage(input, options = {}) {
  try {
    const {
      targetWidth = 1900,
      targetAspectRatio = 16/9,
      quality = 85,
      outputFormat = 'webp',
      outputPath,
      filename,
      forceResize = false,
    } = options;
    
    // Resim nesnesini yükle
    let image = sharp(input);
    
    // Resim meta verilerini al
    const metadata = await image.metadata();
    const { width, height } = metadata;
    const originalAspectRatio = width / height;
    
    // Sonuç nesnesini hazırla
    const result = {
      originalWidth: width,
      originalHeight: height,
      originalAspectRatio,
      outputWidth: width,
      outputHeight: height,
      outputAspectRatio: originalAspectRatio,
      outputFormat,
      resized: false,
      adjusted: false,
    };
    
    // Resim boyutu kontrolü
    if (width < targetWidth || forceResize) {
      // Resmi hedef genişliğe göre yeniden boyutlandır
      const newHeight = Math.round(targetWidth / targetAspectRatio);
      
      image = image.resize({
        width: targetWidth,
        height: newHeight,
        fit: 'cover',
        position: 'centre'
      });
      
      result.outputWidth = targetWidth;
      result.outputHeight = newHeight;
      result.outputAspectRatio = targetAspectRatio;
      result.resized = true;
    } 
    // Hedef orana uygunluğunu kontrol et (16:9 için ±2% tolerans)
    else if (Math.abs(originalAspectRatio - targetAspectRatio) > targetAspectRatio * 0.02) {
      // Oranı düzeltmek için kırp
      const newHeight = Math.round(width / targetAspectRatio);
      
      image = image.resize({
        width: width,
        height: newHeight,
        fit: 'cover',
        position: 'centre'
      });
      
      result.outputHeight = newHeight;
      result.outputAspectRatio = width / newHeight;
      result.adjusted = true;
    }
    
    // Web için optimize et
    image = image.toFormat(outputFormat, { quality });
    
    // Dosya kaydetme
    if (outputPath && filename) {
      // Dizin varlığını kontrol et, yoksa oluştur
      await fs.mkdir(outputPath, { recursive: true });
      
      const fullFilename = `${filename}.${outputFormat}`;
      const fullPath = path.join(outputPath, fullFilename);
      
      await image.toFile(fullPath);
      result.filePath = fullPath;
      result.url = `/uploads/banners/${fullFilename}`;
    } else {
      // Buffer olarak döndür
      result.buffer = await image.toBuffer();
    }
    
    return result;
  } catch (error) {
    logger.error('Resim işlenirken hata:', error);
    throw new Error(`Resim işleme hatası: ${error.message}`);
  }
}

/**
 * Bir resmin boyutunu kontrol eder ve gerekli bilgileri döndürür
 * @param {string|buffer} input - Resim dosyası veya buffer
 * @returns {Promise<object>} Resim boyut bilgileri
 */
export async function checkImageDimensions(input) {
  try {
    const metadata = await sharp(input).metadata();
    const { width, height } = metadata;
    const aspectRatio = width / height;
    const aspectRatioFormatted = formatAspectRatio(aspectRatio);
    
    // Belirli oranlara yakınlığını hesapla
    const standard16by9 = 16/9;
    const standard4by3 = 4/3;
    const standard1by1 = 1;
    
    // En yakın standart oranı bul
    const ratios = [
      { name: '16:9', value: standard16by9, diff: Math.abs(aspectRatio - standard16by9) },
      { name: '4:3', value: standard4by3, diff: Math.abs(aspectRatio - standard4by3) },
      { name: '1:1', value: standard1by1, diff: Math.abs(aspectRatio - standard1by1) }
    ];
    
    ratios.sort((a, b) => a.diff - b.diff);
    const closestRatio = ratios[0];
    
    return {
      width,
      height,
      aspectRatio,
      aspectRatioFormatted,
      isStandard16by9: Math.abs(aspectRatio - standard16by9) < 0.1,
      closestStandardRatio: closestRatio.name,
      format: metadata.format,
      size: metadata.size
    };
  } catch (error) {
    logger.error('Resim boyutları kontrol edilirken hata:', error);
    throw new Error(`Resim kontrol hatası: ${error.message}`);
  }
}

/**
 * Ondalık oran değerini X:Y formatına dönüştürür
 * @param {number} ratio - Oran değeri (örn: 1.78)
 * @returns {string} X:Y formatında oran (örn: '16:9')
 */
function formatAspectRatio(ratio) {
  // Standart oranlar
  if (Math.abs(ratio - 16/9) < 0.01) return '16:9';
  if (Math.abs(ratio - 4/3) < 0.01) return '4:3';
  if (Math.abs(ratio - 1) < 0.01) return '1:1';
  if (Math.abs(ratio - 21/9) < 0.01) return '21:9';
  
  // Özel oranı hesapla
  // En büyük ortak böleni bul
  const gcd = (a, b) => {
    a = Math.round(a * 100);
    b = Math.round(b * 100);
    return b ? gcd(b, a % b) : a;
  };
  
  const precision = 100;
  const ratioX = Math.round(ratio * precision);
  const ratioY = precision;
  const divisor = gcd(ratioX, ratioY);
  
  return `${ratioX / divisor}:${ratioY / divisor}`;
} 