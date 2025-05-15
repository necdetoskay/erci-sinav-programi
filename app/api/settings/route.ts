import { NextResponse } from 'next/server';
import { updateSettings, getSettings, getUserSettings } from '@/lib/settings';
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
    const scope = searchParams.get('scope') || 'user'; // 'user' veya 'global'
    const userId = searchParams.get('userId');

    // Yetkilendirme kontrolü
    if (scope === 'global' && session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ message: 'Unauthorized to access global settings' }, { status: 403 });
    }

    // Başka bir kullanıcının ayarlarına erişim kontrolü
    if (userId && userId !== session.user.id) {
      // Sadece SUPERADMIN başka kullanıcıların ayarlarını görüntüleyebilir
      if (session.user.role !== 'SUPERADMIN') {
        return NextResponse.json({ message: 'Unauthorized to access other user settings' }, { status: 403 });
      }

      console.log(`User ${session.user.id} (${session.user.role}) accessing settings for user ${userId}`);

      // Kullanıcının varlığını kontrol et
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }

      // Belirtilen kullanıcının ayarlarını getir (global + kullanıcı ayarları)
      const userSettings = await getSettings(userId);
      console.log(`Settings for user ${userId}:`, userSettings);
      return NextResponse.json(userSettings, { status: 200 });
    }

    // Kullanıcı bazında veya global ayarları getir
    const settings = await getSettings(scope === 'user' ? session.user.id : undefined);
    console.log(`Settings for current user ${session.user.id}:`, settings);
    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ message: 'Error fetching settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // URL'den parametreleri al
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'user'; // 'user' veya 'global'
    const userId = searchParams.get('userId');

    // Yetkilendirme kontrolü
    if (scope === 'global' && session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ message: 'Unauthorized to update global settings' }, { status: 403 });
    }

    // Başka bir kullanıcının ayarlarını güncelleme kontrolü
    if (userId && userId !== session.user.id) {
      // Sadece SUPERADMIN başka kullanıcıların ayarlarını güncelleyebilir
      if (session.user.role !== 'SUPERADMIN') {
        return NextResponse.json({ message: 'Unauthorized to update other user settings' }, { status: 403 });
      }

      console.log(`User ${session.user.id} (${session.user.role}) updating settings for user ${userId}`);

      // Kullanıcının varlığını kontrol et
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }

      const settingsToUpdate = await request.json();

      console.log(`Updating settings for user ${userId}:`, settingsToUpdate);

      // Belirtilen kullanıcının ayarlarını güncelle
      await updateSettings(settingsToUpdate, userId);

      // Güncellenmiş ayarları getir
      const updatedSettings = await getSettings(userId);
      console.log(`Updated settings for user ${userId}:`, updatedSettings);

      return NextResponse.json({
        message: `User settings updated successfully for user ${userId}`,
        settings: updatedSettings
      }, { status: 200 });
    }

    const settingsToUpdate = await request.json();

    console.log(`Updating ${scope} settings for current user:`, settingsToUpdate);

    // Kullanıcı bazında veya global ayarları güncelle
    await updateSettings(settingsToUpdate, scope === 'user' ? session.user.id : undefined);

    // Güncellenmiş ayarları getir
    const updatedSettings = await getSettings(scope === 'user' ? session.user.id : undefined);
    console.log(`Updated ${scope} settings:`, updatedSettings);

    return NextResponse.json({
      message: `${scope === 'user' ? 'User' : 'Global'} settings updated successfully`,
      settings: updatedSettings
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ message: 'Error updating settings' }, { status: 500 });
  }
}
