import { NextResponse } from 'next/server';
import { getUserSettings } from '@/lib/settings';
import { getServerSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // URL'den parametreleri al
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Kullanıcı ID'si belirtilmemişse hata döndür
    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    // Başka bir kullanıcının ayarlarına erişim kontrolü
    if (userId !== session.user.id) {
      // Sadece SUPERADMIN başka kullanıcıların ayarlarını görüntüleyebilir
      if (session.user.role !== 'SUPERADMIN') {
        return NextResponse.json({ message: 'Unauthorized to access other user settings' }, { status: 403 });
      }
      
      console.log(`User ${session.user.id} (${session.user.role}) accessing user-only settings for user ${userId}`);

      // Kullanıcının varlığını kontrol et
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
    }

    // Sadece kullanıcı ayarlarını getir (global ayarları dahil etme)
    const userSettings = await getUserSettings(userId);
    console.log(`User-only settings for ${userId}:`, userSettings);
    
    return NextResponse.json(userSettings, { status: 200 });
  } catch (error) {
    console.error('Error fetching user-only settings:', error);
    return NextResponse.json({ message: 'Error fetching user-only settings' }, { status: 500 });
  }
}
