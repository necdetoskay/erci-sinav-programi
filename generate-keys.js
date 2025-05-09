// Güçlü rastgele değerler oluşturmak için script
const crypto = require('crypto');

// NEXTAUTH_SECRET için güçlü bir değer oluştur (base64 formatında)
const nextAuthSecret = crypto.randomBytes(32).toString('base64');
console.log('NEXTAUTH_SECRET:', nextAuthSecret);

// ENCRYPTION_KEY için güçlü bir değer oluştur (32 karakter hex formatında)
const encryptionKey = crypto.randomBytes(16).toString('hex');
console.log('ENCRYPTION_KEY:', encryptionKey);
