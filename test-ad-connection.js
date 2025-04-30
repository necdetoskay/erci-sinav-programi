const ldap = require('ldapjs');

const adServer = '172.41.41.5'; // Kullanıcının sağladığı IP
const bindUser = 'noskay@kentkonut.local'; // Kullanıcının sağladığı kullanıcı adı
const bindPassword = '0renegade***'; // Kullanıcının sağladığı şifre

async function testAdConnection(port, useSSL = false) {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({
      url: `${useSSL ? 'ldaps' : 'ldap'}://${adServer}:${port}`,
      tlsOptions: useSSL ? { rejectUnauthorized: false } : undefined, // LDAPS için gerekebilir
      timeout: 5000, // Bağlantı zaman aşımı (ms)
      connectTimeout: 5000 // Bağlantı zaman aşımı (ms)
    });

    client.on('error', (err) => {
        // Hata durumunda client'ı kapat
        if (!client.destroyed) {
            client.destroy();
        }
        reject(err);
    });

    client.bind(bindUser, bindPassword, (err) => {
      if (err) {
        // Hata durumunda client'ı kapat
        if (!client.destroyed) {
            client.destroy();
        }
        reject(err);
      } else {
        console.log(`Bağlantı başarılı: ${useSSL ? 'LDAPS' : 'LDAP'} port ${port}`);
        client.unbind(() => {
            // Bağlantıyı kapat
            resolve(true);
        });
      }
    });
  });
}

async function runTest() {
  console.log(`Active Directory bağlantısı test ediliyor: ${adServer}`);

  try {
    console.log('Port 389 (LDAP) deneniyor...');
    await testAdConnection(389, false);
    console.log('Test tamamlandı.');
  } catch (err389) {
    console.error(`Port 389 (LDAP) bağlantı hatası: ${err389.message}`);
    console.log('Port 636 (LDAPS) deneniyor...');
    try {
      await testAdConnection(636, true);
      console.log('Test tamamlandı.');
    } catch (err636) {
      console.error(`Port 636 (LDAPS) bağlantı hatası: ${err636.message}`);
      console.error('Her iki portta da bağlantı kurulamadı.');
    }
  }
}

runTest();
