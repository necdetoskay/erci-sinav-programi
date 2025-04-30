// app/api/send-email/route.js
import axios from 'axios';
import { NextResponse } from 'next/server'; // Next.js 13/14 App Router için NextResponse kullanıyoruz

export async function POST(req) { // App Router'da handler fonksiyonu POST olarak export edilir
  if (req.method !== 'POST') {
    return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { subject, body, recipients } = await req.json(); // İstek gövdesini json olarak alıyoruz

    // OWA bilgileri
    const username = process.env.OWA_USERNAME;
    const password = process.env.OWA_PASSWORD;
    const owaUrl = process.env.OWA_URL; // örn: "https://mail.sirketiniz.com/EWS/Exchange.asmx"

    // Gerekli ortam değişkenlerinin kontrolü
    if (!username || !password || !owaUrl) {
        return NextResponse.json({ message: 'OWA environment variables not set' }, { status: 500 });
    }

    // Base64 ile Basic Authentication
    const auth = Buffer.from(`${username}:${password}`).toString('base64');

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
                <t:Subject>${subject}</t:Subject>
                <t:Body BodyType="Text">${body}</t:Body>
                ${recipients.map(email => `
                  <t:ToRecipients>
                    <t:Mailbox>
                      <t:EmailAddress>${email}</t:EmailAddress>
                    </t:Mailbox>
                  </t:ToRecipients>
                `).join('')}
              </t:Message>
            </m:Items>
          </m:CreateItem>
        </soap:Body>
      </soap:Envelope>
    `;

    const response = await axios({
      method: 'post',
      url: `${owaUrl}/EWS/Exchange.asmx`,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://schemas.microsoft.com/exchange/services/2006/messages/CreateItem'
      },
      data: soapEnvelope
    });

    // EWS yanıtını kontrol etme (başarı durumu genellikle SOAP yanıtının içinde olur)
    // Basit bir kontrol: yanıt metninde "ResponseCode>NoError</ResponseCode>" arayabiliriz
    if (response.data && response.data.includes('ResponseCode>NoError</ResponseCode>')) {
        return NextResponse.json({ success: true, message: 'Email sent successfully via EWS' }, { status: 200 });
    } else {
        // EWS'den gelen hata detayını logla ve kullanıcıya döndür
        console.error('EWS E-posta gönderme hatası:', response.data);
        return NextResponse.json({
            message: 'E-posta gönderilirken EWS hatası oluştu',
            error: response.data // EWS'den gelen tüm yanıtı döndür
        }, { status: 500 });
    }

  } catch (error) {
    console.error('API E-posta gönderme hatası:', error.response?.data || error.message || error);
    return NextResponse.json({
      message: 'API tarafında hata oluştu',
      error: error.response?.data || error.message || error
    }, { status: 500 });
  }
}
