import crypto from 'crypto';

/**
 * API anahtarını maskeleyerek göster (ilk ve son 4 karakter hariç)
 * @param apiKey API anahtarı
 * @returns Maskelenmiş API anahtarı
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) return '••••••••';

  const firstFour = apiKey.substring(0, 4);
  const lastFour = apiKey.substring(apiKey.length - 4);
  const middleMask = '•'.repeat(apiKey.length - 8);

  return `${firstFour}${middleMask}${lastFour}`;
}

/**
 * Güçlü bir token oluşturur (şifre sıfırlama, doğrulama vb. için)
 * @param length Token uzunluğu (varsayılan: 32)
 * @returns Belirtilen uzunlukta rastgele bir token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

/**
 * Güvenli bir şekilde iki string'i karşılaştırır (timing attack'lere karşı koruma)
 * @param a İlk string
 * @param b İkinci string
 * @returns İki string eşitse true, değilse false
 */
export function secureCompare(a: string, b: string): boolean {
  // Farklı uzunluktaki string'ler kesinlikle eşit değildir
  if (a.length !== b.length) return false;

  // crypto.timingSafeEqual sadece Buffer veya TypedArray kabul eder
  return crypto.timingSafeEqual(
    Buffer.from(a, 'utf8'),
    Buffer.from(b, 'utf8')
  );
}
