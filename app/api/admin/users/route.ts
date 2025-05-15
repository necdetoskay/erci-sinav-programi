import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const session = await getServerSession();

    // Yetkilendirme kontrolü
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Sadece ADMIN ve SUPERADMIN kullanıcıları erişebilir
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // URL'den parametreleri al
    const { searchParams } = new URL(request.url);
    const withSettings = searchParams.get('withSettings') === 'true';
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Debug için
    console.log("Users API - Sayfa:", page, "Limit:", limit, "Role:", role, "Search:", search);

    // Filtreleme koşullarını oluştur
    const where: any = {};

    // SUPERADMIN kullanıcısı tüm kullanıcıları görebilir
    if (session.user.role === 'SUPERADMIN') {
      // URL'den rol filtresi geldi mi?
      if (role && role !== 'ALL') {
        // Virgülle ayrılmış rolleri diziye çevir
        const roles = role.split(',');
        where.role = { in: roles };
      }
      // Rol filtresi yoksa tüm kullanıcılar
    }
    // ADMIN kullanıcısı sadece PERSONEL ve USER rolündeki kullanıcıları görebilir
    else if (session.user.role === 'ADMIN') {
      // URL'den rol filtresi geldi mi?
      if (role && role !== 'ALL') {
        // Virgülle ayrılmış rolleri diziye çevir ve ADMIN'in görebileceği rollerle kesişimini al
        const roles = role.split(',').filter(r => ['PERSONEL', 'USER'].includes(r));
        if (roles.length > 0) {
          where.role = { in: roles };
        } else {
          where.role = { in: ['PERSONEL', 'USER'] };
        }
      } else {
        where.role = { in: ['PERSONEL', 'USER'] };
      }
    }

    // Arama filtresi
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Kullanıcıları getir
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        // Eğer withSettings=true ise kullanıcı ayarlarını da getir
        ...(withSettings ? {
          settings: {
            select: {
              key: true,
              value: true
            }
          }
        } : {})
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    // Toplam kullanıcı sayısını getir
    const totalCount = await prisma.user.count({ where });
    const totalPages = Math.ceil(totalCount / limit);

    // Debug için
    console.log("Users API - Toplam kullanıcı sayısı:", totalCount);
    console.log("Users API - Döndürülen kullanıcı sayısı:", users.length);
    console.log("Users API - Where koşulu:", JSON.stringify(where));

    // E-posta adreslerindeki tırnak işaretlerini temizle
    const cleanedUsers = users.map(user => ({
      ...user,
      email: user.email?.replace(/^"|"$/g, '') || user.email
    }));

    return NextResponse.json({
      users: cleanedUsers,
      totalCount,
      totalPages,
      currentPage: page
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ message: 'Error fetching users' }, { status: 500 });
  }
}
