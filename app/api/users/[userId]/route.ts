import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { hash } from "bcryptjs";

// Kullanıcı güncelle
export async function PATCH(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, email, role, status, password } = body;

    if (!name || !email || !role || !status) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Temel güncelleme verilerini hazırla
    const updateData: any = {
      name,
      email,
      role,
      status,
    };

    // Eğer şifre varsa, hash'leyip ekle
    if (password) {
      updateData.password = await hash(password, 12);
    }

    const user = await db.user.update({
      where: {
        id: parseInt(params.userId),
      },
      data: updateData,
    });

    // Şifreyi response'dan çıkar
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("[USER_PATCH]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Kullanıcı sil
export async function DELETE(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await db.user.delete({
      where: {
        id: parseInt(params.userId),
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[USER_DELETE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 