/**
 * Bir async controller fonksiyonunu sarmalayan, hataları otomatik olarak yakalayan
 * ve sonraki error middleware'e ileten fonksiyon.
 * 
 * @param {Function} fn - Async controller fonksiyonu
 * @returns {Function} Express middleware fonksiyonu
 */
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}; 