/**
 * Exchange Web Services (EWS) API kullanarak e-posta gönderme testi
 * 
 * Bu script, verilen kullanıcı bilgileriyle Exchange Server üzerinden
 * EWS API kullanarak test e-postası gönderir.
 * 
 * Kullanım:
 * node scripts/send-test-email-ews.js
 */

const axios = require('axios');

// E-posta bilgileri
const FROM_EMAIL = 'noskay@kentkonut.com.tr';
const TO_EMAIL = 'noskay@kentkonut.com.tr';
const SUBJECT = 'Exchange EWS Test E-postası';
const BODY = 'Bu bir test e-postasıdır. Exchange Web Services API üzerinden gönderilmiştir.';

// Exchange Server ayarları
const EWS_URL = 'https://172.41.41.14/EWS/Exchange.asmx';
const USERNAME = 'kentkonut\\noskay';
const PASSWORD = '0renegade***';

async function sendEmailViaEWS() {
  console.log('Exchange Web Services E-posta Gönderme Testi');
  console.log('='.repeat(50));
  
  // Exchange ayarlarını göster
  console.log('Exchange Server Ayarları:');
  console.log(`EWS URL: ${EWS_URL}`);
  console.log(`Username: ${USERNAME}`);
  console.log('='.repeat(50));
  
  // E-posta bilgilerini göster
  console.log('E-posta Bilgileri:');
  console.log(`From: ${FROM_EMAIL}`);
  console.log(`To: ${TO_EMAIL}`);
  console.log(`Subject: ${SUBJECT}`);
  console.log('='.repeat(50));
  
  try {
    // Base64 ile Basic Authentication
    const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
    
    // EWS SOAP isteği için XML oluşturma
    const soapEnvelope = `
      <?xml version="1.0" encoding="utf-8"?>
      <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                     xmlns:m="http://schemas.microsoft.com/exchange/services/2006/messages"
                     xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types"
                     xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Header>
          <t:RequestServerVersion Version="Exchange2013" />
        </soap:Header>
        <soap:Body>
          <m:CreateItem MessageDisposition="SendAndSaveCopy">
            <m:SavedItemFolderId>
              <t:DistinguishedFolderId Id="sentitems" />
            </m:SavedItemFolderId>
            <m:Items>
              <t:Message>
                <t:Subject>${SUBJECT}</t:Subject>
                <t:Body BodyType="Text">${BODY}</t:Body>
                <t:ToRecipients>
                  <t:Mailbox>
                    <t:EmailAddress>${TO_EMAIL}</t:EmailAddress>
                  </t:Mailbox>
                </t:ToRecipients>
              </t:Message>
            </m:Items>
          </m:CreateItem>
        </soap:Body>
      </soap:Envelope>
    `;
    
    console.log('E-posta gönderiliyor...');
    
    // EWS API'ye istek gönder
    const response = await axios({
      method: 'post',
      url: EWS_URL,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://schemas.microsoft.com/exchange/services/2006/messages/CreateItem'
      },
      data: soapEnvelope,
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false // Sertifika doğrulama sorunları için
      })
    });
    
    // Yanıtı kontrol et
    if (response.data && response.data.includes('ResponseCode>NoError</ResponseCode>')) {
      console.log('E-posta başarıyla gönderildi!');
      return response.data;
    } else {
      console.error('EWS yanıtında hata var:', response.data);
      throw new Error('EWS yanıtında hata var');
    }
  } catch (error) {
    console.error('E-posta gönderme hatası:', error.message);
    if (error.response) {
      console.error('Yanıt detayları:', error.response.data);
    }
    throw error;
  }
}

// Scripti çalıştır
sendEmailViaEWS()
  .then(() => console.log('İşlem tamamlandı.'))
  .catch(error => {
    console.error('Beklenmeyen hata:', error);
    process.exit(1);
  });
