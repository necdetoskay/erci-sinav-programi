import { generateRandomCode } from '@/lib/utils';

describe('generateRandomCode', () => {
  test('should generate a random code with the specified length', () => {
    const length = 8;
    const code = generateRandomCode(length);
    
    expect(code.length).toBe(length);
  });

  test('should generate a code with only allowed characters', () => {
    const code = generateRandomCode(20);
    const allowedCharacters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    
    // Her karakter izin verilen karakterlerden biri olmalı
    for (const char of code) {
      expect(allowedCharacters).toContain(char);
    }
  });

  test('should not contain excluded characters (0, O, 1, I)', () => {
    const code = generateRandomCode(100); // Daha uzun bir kod, daha iyi test için
    const excludedCharacters = '01OI';
    
    // Dışlanan karakterler olmamalı
    for (const char of excludedCharacters) {
      expect(code).not.toContain(char);
    }
  });

  test('should generate different codes on subsequent calls', () => {
    const code1 = generateRandomCode(10);
    const code2 = generateRandomCode(10);
    
    expect(code1).not.toBe(code2);
  });

  test('should handle zero length', () => {
    const code = generateRandomCode(0);
    
    expect(code).toBe('');
  });

  test('should handle large lengths', () => {
    const length = 100;
    const code = generateRandomCode(length);
    
    expect(code.length).toBe(length);
  });
});
