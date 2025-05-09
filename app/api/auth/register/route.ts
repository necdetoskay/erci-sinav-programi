// app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Prisma client import yolu
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client'; // Prisma'dan gelen Role enum'u

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }
    // İsteğe bağlı: Daha güçlü e-posta ve şifre formatı doğrulaması (örn: Zod ile)

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 } // Conflict
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10); // 10 salt round önerilir

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role: Role.USER, // Varsayılan rol
      },
    });

    const { password: _, ...userWithoutPassword } = newUser; // Yanıttan şifreyi çıkar

    return NextResponse.json(
      { user: userWithoutPassword, message: 'User created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { message: 'Error creating user', error: errorMessage },
      { status: 500 }
    );
  }
}
