import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { getServerSession } from "@/lib/session";

// Rol seviyesini döndüren yardımcı fonksiyon
function getRoleLevel(role: string): number {
  switch (role) {
    case 'SUPERADMIN': return 4;
    case 'ADMIN': return 3;
    case 'USER': return 2;
    case 'PERSONEL': return 1;
    default: return 0;
  }
}

// Tüm kullanıcıları getir
export async function GET(request: Request) {
  try {
    // Oturum bilgisini al
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // URL'den parametreleri al
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const role = searchParams.get('role');

    console.log("Users API - Search:", search, "Role:", role);

    // Kullanıcının rolünü al
    const userRole = session.user.role;
    const userRoleLevel = getRoleLevel(userRole);

    // Filtreleme koşullarını oluştur
    const where: any = {};

    // Rol filtresi
    if (role && role !== 'ALL') {
      where.role = role;
    }

    // Arama filtresi
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Tüm kullanıcıları getir
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
      },
    });

    // Kullanıcının görebileceği kullanıcıları filtrele
    // Kullanıcı kendi seviyesindeki ve üstündeki kullanıcıları göremez
    // USER rolündeki kullanıcılar da görüntülenmeli
    const filteredUsers = users.filter(user => {
      const roleLevel = getRoleLevel(user.role);
      return roleLevel < userRoleLevel || user.role === 'USER';
    });

    // E-posta adreslerindeki tırnak işaretlerini temizle
    const cleanedUsers = filteredUsers.map(user => ({
      ...user,
      email: user.email?.replace(/^"|"$/g, '') || user.email
    }));

    return NextResponse.json(cleanedUsers);
  } catch (error) {
    console.error("Error in GET /api/users:", error); // Log the actual error
    return NextResponse.json(
      { error: "Failed to fetch users", details: error instanceof Error ? error.message : String(error) }, // Optionally include details
      { status: 500 }
    );
  }
}

// Yeni kullanıcı ekle
export async function POST(request: Request) {
  try {
    // Oturum bilgisini al
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Kullanıcının rolünü al
    const userRole = session.user.role;
    const userRoleLevel = getRoleLevel(userRole);

    const { name, email, password, role, emailVerified } = await request.json();

    const requiredFields = ["name", "email", "password", "role"];
    const missingFields = requiredFields.filter(
      (field) => !eval(field)
    );

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required fields: ${missingFields.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Kullanıcının oluşturmaya çalıştığı rolün seviyesini kontrol et
    const newRoleLevel = getRoleLevel(role);

    // Kullanıcı kendi seviyesinde veya üstünde bir rol oluşturamaz
    if (newRoleLevel >= userRoleLevel) {
      return NextResponse.json(
        { error: "You cannot create a user with equal or higher role level" },
        { status: 403 }
      );
    }

    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        emailVerified: emailVerified ? new Date() : null // E-posta onay durumuna göre işaretle
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
