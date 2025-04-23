/**
 * URL'den bir resim nesnesi oluşturur
 * @param url - Resmin URL'si
 * @returns HTMLImageElement Promise'i
 */
export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

import { Crop } from 'react-image-crop';

/**
 * Bir resmi belirtilen piksel koordinatlarına göre kırpar
 * @param image - Resim nesnesi
 * @param crop - Kırpma alanı
 * @param fileName - Oluşturulacak dosyanın adı
 * @returns Kırpılmış resim dosyası ve URL'yi içeren bir Promise
 */
export const getCroppedImg = async (
  image: HTMLImageElement,
  crop: Crop,
  fileName: string
): Promise<{ file: File; url: string } | null> => {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio;
  
  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No 2d context');
  }

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = 'high';

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;
  const cropWidth = crop.width * scaleX;
  const cropHeight = crop.height * scaleY;

  ctx.drawImage(
    image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }

        const file = new File([blob], fileName, { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);
        resolve({ file, url });
      },
      'image/jpeg',
      0.95
    );
  });
}; 