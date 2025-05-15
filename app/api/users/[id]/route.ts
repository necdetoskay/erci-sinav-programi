import { NextRequest, NextResponse } from "next/server";
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

// Kullanıcı detaylarını getir
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Oturum bilgisini al
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = params.id;

    // Kullanıcıyı getir
    const user = await prisma.user.findUnique({
      where: { id: id },
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

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Kullanıcının rolünü al
    const userRole = session.user.role;
    const userRoleLevel = getRoleLevel(userRole);

    // Hedef kullanıcının rolünü al
    const targetRoleLevel = getRoleLevel(user.role);

    // Kullanıcı kendi seviyesindeki ve üstündeki kullanıcıları göremez
    if (targetRoleLevel >= userRoleLevel) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Handler for DELETE /api/users/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Oturum bilgisini al
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Kullanıcıyı getir
    const user = await prisma.user.findUnique({
      where: { id: id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Kullanıcının rolünü al
    const userRole = session.user.role;
    const userRoleLevel = getRoleLevel(userRole);

    // Hedef kullanıcının rolünü al
    const targetRoleLevel = getRoleLevel(user.role);

    // Kullanıcı kendi seviyesindeki ve üstündeki kullanıcıları silemez
    if (targetRoleLevel >= userRoleLevel) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Kullanıcıyı sil
    await prisma.user.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error: any) {
    console.error(`Error deleting user:`, error);

    // Handle specific Prisma error if user not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Generic error for other issues
    return NextResponse.json(
      { error: "Failed to delete user", details: error.message },
      { status: 500 }
    );
  }
}

// Handler for PUT /api/users/[id] (Update User)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Oturum bilgisini al
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Kullanıcıyı getir
    const user = await prisma.user.findUnique({
      where: { id: id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Kullanıcının rolünü al
    const userRole = session.user.role;
    const userRoleLevel = getRoleLevel(userRole);

    // Hedef kullanıcının rolünü al
    const targetRoleLevel = getRoleLevel(user.role);

    // Kullanıcı kendi seviyesindeki ve üstündeki kullanıcıları güncelleyemez
    if (targetRoleLevel >= userRoleLevel) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, role, password, emailVerified } = body;

    // Güncelleme verilerini hazırla
    const updateData: any = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;

    // E-posta onay durumu
    if (emailVerified !== undefined) {
      updateData.emailVerified = emailVerified ? new Date() : null;
    }

    // Rol değişikliği varsa kontrol et
    if (role) {
      const newRoleLevel = getRoleLevel(role);

      // Kullanıcı kendi seviyesinde veya üstünde bir rol atayamaz
      if (newRoleLevel >= userRoleLevel) {
        return NextResponse.json(
          { error: "You cannot assign a role equal to or higher than your own" },
          { status: 403 }
        );
      }

      updateData.role = role;
    }

    // Şifre varsa hashle
    if (password) {
      updateData.password = await hash(password, 12);
    }

    // Kullanıcıyı güncelle
    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: updateData,
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

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error(`Error updating user:`, error);

    // Handle specific Prisma error if user not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    // Handle unique constraint violation (e.g., email already taken)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Email address is already in use by another account." },
        { status: 409 } // 409 Conflict is appropriate here
      );
    }

    // Generic error for other issues
    return NextResponse.json(
      { error: "Failed to update user", details: error.message },
      { status: 500 }
    );
  }
}


// Optional: Add GET handler if you need to fetch a single user by ID later
// export async function GET(request: Request, { params }: { params: { id: string } }) { ... }
