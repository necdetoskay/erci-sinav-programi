import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { Role } from '@prisma/client';

// Rol seviyelerini belirle (yüksek sayı = yüksek yetki)
const roleLevels: Record<string, number> = {
  'USER': 1,
  'PERSONEL': 2,
  'ADMIN': 3,
  'SUPERADMIN': 4,
};

// Rol seviyesini döndür
function getRoleLevel(role: string): number {
  return roleLevels[role] || 0;
}

interface UserData {
  name: string;
  email: string;
}

interface ProcessedResult {
  success: boolean;
  message: string;
  data: {
    totalProcessed: number;
    successCount: number;
    failedCount: number;
    successfulUsers: Array<UserData>;
    failedUsers: Array<UserData & { error: string }>;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Oturum kontrolü
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Sadece ADMIN ve SUPERADMIN rollerine izin ver
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Kullanıcının rolünü al
    const userRole = session.user.role;
    const userRoleLevel = getRoleLevel(userRole);

    // İstek verilerini al
    const { userList, defaultPassword, autoVerify } = await request.json();

    if (!userList || !defaultPassword) {
      return NextResponse.json(
        { error: 'Personel listesi ve varsayılan şifre gereklidir' },
        { status: 400 }
      );
    }

    // Şifreyi hashle
    const hashedPassword = await hash(defaultPassword, 12);

    // Kullanıcı listesini satırlara ayır
    const lines = userList.split('\n').filter(line => line.trim() !== '');

    // Sonuç nesnesi
    const result: ProcessedResult = {
      success: true,
      message: 'İşlem tamamlandı',
      data: {
        totalProcessed: lines.length,
        successCount: 0,
        failedCount: 0,
        successfulUsers: [],
        failedUsers: [],
      },
    };

    // Her satır için işlem yap
    for (const line of lines) {
      try {
        // Satırı virgülle ayır
        const [name, email] = line.split(',').map(item => item.trim());

        // Gerekli alanları kontrol et
        if (!name || !email) {
          result.data.failedUsers.push({
            name: name || 'Bilinmeyen',
            email: email || 'Bilinmeyen',
            error: 'Ad soyad veya e-posta eksik',
          });
          result.data.failedCount++;
          continue;
        }

        // E-posta formatını kontrol et
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          result.data.failedUsers.push({
            name,
            email,
            error: 'Geçersiz e-posta formatı',
          });
          result.data.failedCount++;
          continue;
        }

        // E-posta adresi zaten var mı kontrol et
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          result.data.failedUsers.push({
            name,
            email,
            error: 'Bu e-posta adresi zaten kullanılıyor',
          });
          result.data.failedCount++;
          continue;
        }

        // Kullanıcıyı oluştur
        await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: Role.PERSONEL, // Varsayılan rol PERSONEL
            emailVerified: autoVerify ? new Date() : null, // Otomatik onay seçeneğine göre
          },
        });

        // Başarılı kullanıcıları ekle
        result.data.successfulUsers.push({ name, email });
        result.data.successCount++;
      } catch (error) {
        console.error('Kullanıcı oluşturma hatası:', error);
        
        // Hata mesajını al
        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
        
        // Satırı parse etmeye çalış
        let name = 'Bilinmeyen';
        let email = 'Bilinmeyen';
        
        try {
          const parts = line.split(',').map(item => item.trim());
          name = parts[0] || 'Bilinmeyen';
          email = parts[1] || 'Bilinmeyen';
        } catch (parseError) {
          // Parse hatası, varsayılan değerleri kullan
        }
        
        result.data.failedUsers.push({
          name,
          email,
          error: errorMessage,
        });
        result.data.failedCount++;
      }
    }

    // Sonuç mesajını güncelle
    if (result.data.failedCount > 0) {
      if (result.data.successCount === 0) {
        result.success = false;
        result.message = 'Hiçbir kullanıcı oluşturulamadı';
      } else {
        result.message = `${result.data.successCount} kullanıcı başarıyla oluşturuldu, ${result.data.failedCount} kullanıcı oluşturulamadı`;
      }
    } else {
      result.message = `${result.data.successCount} kullanıcı başarıyla oluşturuldu`;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Toplu personel kaydı hatası:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'İşlem sırasında bir hata oluştu',
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}
