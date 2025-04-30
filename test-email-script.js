const axios = require('axios');
require('dotenv').config(); // Ortam değişkenlerini .env dosyasından yüklemek için

async function sendTestEmail() {
  const owaUrl = "https://owa.kentkonut.com.tr/owa"; // Kullanıcının sağladığı bilgi
  const username = "kentkonut\\noskay"; // Kullanıcının sağladığı bilgi
  const password = "0renegade***"; // Kullanıcının sağladığı bilgi

  if (!owaUrl || !username || !password) {
    console.error("Lütfen OWA_URL, OWA_USERNAME ve OWA_PASSWORD değişkenlerini ayarlayın.");
    return;
  }

  const testEmailData = {
    subject: "Test E-postası (Script)",
    body: "Bu, test scripti tarafından gönderilen bir e-postadır.",
    recipients: ["noskay@kentkonut.com.tr"] // Kullanıcının sağladığı bilgi
  };

  try {
    // API endpoint'inizin doğru URL'sini girin.
    // Eğer paylaştığınız kod pages/api/send-email.js yolundaysa, URL http://localhost:3000/api/send-email olacaktır.
    const response = await axios.post('http://localhost:3000/api/send-email', testEmailData);

    if (response.status === 200) {
      console.log("Test e-postası başarıyla gönderildi.");
    } else {
      console.error("E-posta gönderme hatası:", response.data);
    }
  } catch (error) {
    console.error('E-posta gönderme sırasında bir hata oluştu:', error);
  }
}

sendTestEmail();
