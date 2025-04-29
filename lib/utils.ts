import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Verilen uzunlukta rastgele alfanumerik kod oluşturur
 * @param length Kod uzunluğu
 * @returns Rastgele oluşturulmuş alfanumerik kod
 */
export function generateRandomCode(length: number): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Karışabilecek karakterler (0, O, 1, I) hariç tutuldu
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  
  return result;
}
