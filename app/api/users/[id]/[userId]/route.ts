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
  { params }: { params: { userId: string } }
) {
  try {
    // Oturum bilgisini al
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = params.userId;
    
    // Kullanıcıyı getir
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

// Kullanıcı güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Oturum bilgisini al
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = params.userId;
    const { name, email, role, password } = await request.json();
    
    // Kullanıcıyı getir
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
    
    // Yeni rol seviyesini kontrol et
    if (role) {
      const newRoleLevel = getRoleLevel(role);
      
      // Kullanıcı kendi seviyesinde veya üstünde bir rol atayamaz
      if (newRoleLevel >= userRoleLevel) {
        return NextResponse.json(
          { error: "You cannot assign a role equal to or higher than your own" },
          { status: 403 }
        );
      }
    }
    
    // Güncelleme verilerini hazırla
    const updateData: any = {};
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    
    // Şifre varsa hashle
    if (password) {
      updateData.password = await hash(password, 12);
    }
    
    // Kullanıcıyı güncelle
    const updatedUser = await prisma.user.update({
      where: { id: userId },
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
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Kullanıcı sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Oturum bilgisini al
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = params.userId;
    
    // Kullanıcıyı getir
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
      where: { id: userId },
    });
    
    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
