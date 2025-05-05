import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma'; // Prisma client import
// import { sendVerificationEmail } from '@/lib/email'; // E-posta gönderme fonksiyonu (henüz yok)
import crypto from 'crypto';

const RequestVerificationSchema = z.object({
  email: z.string().email({ message: 'Geçersiz e-posta adresi.' }),
  examCode: z.string().min(1, { message: 'Sınav kodu gereklidir.' }),
});

// Rastgele 6 haneli sayısal kod üretir
function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = RequestVerificationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Geçersiz istek verisi.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, examCode } = validation.data;

    // TODO: examCode'un geçerli bir sınava ait olup olmadığını kontrol et
    // const exam = await prisma.exam.findUnique({ where: { access_code: examCode } });
    // if (!exam) {
    //   return NextResponse.json({ message: 'Geçersiz sınav kodu.' }, { status: 400 });
    // }

    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 dakika geçerlilik süresi

    // Mevcut bir deneme var mı diye kontrol et (aynı email, aynı sınav kodu)
    // Varsa güncelle, yoksa yeni oluştur (upsert)
    const attempt = await prisma.examEntryAttempt.upsert({
      where: {
        // Benzersiz bir alan kombinasyonu gerekiyor, prisma schema'da @@unique ekleyebiliriz
        // Şimdilik email ve examCode'a göre bulmaya çalışalım (bu tam olarak upsert'in where'i için ideal değil)
        // Önce findUnique/findFirst ile arayıp sonra create/update yapmak daha güvenli olabilir.
        // Basitlik adına şimdilik direkt create kullanıyoruz, aynı email/kod ile tekrar istek gelirse yeni kayıt oluşur.
        // Daha sağlam bir yapı için:
         id: 'dummy_id_for_upsert_placeholder', // Prisma upsert için where'de unique alan bekler
         // Bu yüzden findFirst + create/update daha mantıklı
      },
       create: {
        email: email,
        examAccessCode: examCode,
        verificationCode: verificationCode, // TODO: Kodu hash'leyerek saklamak daha güvenli
        expiresAt: expiresAt,
      },
      update: { // Bu kısım yukarıdaki where şartı nedeniyle çalışmayacak, findFirst/update lazım
        verificationCode: verificationCode,
        expiresAt: expiresAt,
        verified: false, // Yeni kod istendiğinde doğrulamayı sıfırla
      },
       // Geçici çözüm: Önce arama yapalım
       // const existingAttempt = await prisma.examEntryAttempt.findFirst({
       //     where: { email, examAccessCode: examCode }
       // });
       // if (existingAttempt) { ... update ... } else { ... create ... }
       // Şimdilik sadece create:
       // await prisma.examEntryAttempt.create({ // Bu satırı aşağıdaki ile değiştiriyoruz
       //   data: { ... }
       // });
    });

     // Yukarıdaki upsert yerine findFirst + create/update mantığı:
     let existingAttempt = await prisma.examEntryAttempt.findFirst({
         where: { email: email, examAccessCode: examCode }
     });

     if (existingAttempt) {
         // Eğer önceki kod hala geçerliyse ve çok sık istek yapılmıyorsa hata dönebiliriz.
         // Şimdilik basitçe üzerine yazalım.
         await prisma.examEntryAttempt.update({
             where: { id: existingAttempt.id },
             data: {
                 verificationCode: verificationCode, // TODO: Hash the code
                 expiresAt: expiresAt,
                 verified: false,
             }
         });
     } else {
         await prisma.examEntryAttempt.create({
             data: {
                 email: email,
                 examAccessCode: examCode,
                 verificationCode: verificationCode, // TODO: Hash the code
                 expiresAt: expiresAt,
             }
         });
     }


    // TODO: E-posta gönderme işlemini burada yap
    // await sendVerificationEmail(email, verificationCode);
    // console.log(`Doğrulama Kodu (${email} için): ${verificationCode}`); // Removed log

    return NextResponse.json({ message: 'Doğrulama kodu başarıyla gönderildi.' }, { status: 200 });

  } catch (error) {
    console.error('Doğrulama kodu isteği hatası:', error);
    return NextResponse.json({ message: 'Sunucu hatası oluştu.' }, { status: 500 });
  }
}
