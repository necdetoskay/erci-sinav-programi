import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = validationResult.data;

    // Check if user already exists using Prisma ORM
    // console.log(`[Register Route] Checking for existing user with email (ORM): ${email}`); // Removed log
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    // console.log(`[Register Route] Result of findUnique (ORM):`, existingUser); // Removed log

    // Check if user already exists using Raw SQL
    // console.log(`[Register Route] Checking for existing user with email (Raw SQL): ${email}`); // Removed log
    const rawResult: any[] = await prisma.$queryRaw`SELECT * FROM "User" WHERE email = ${email}`;
    // console.log(`[Register Route] Result of $queryRaw (Raw SQL):`, rawResult); // Removed log


    if (existingUser) {
      // Decision still based on ORM result for now, but we have raw log
      // console.log(`[Register Route] Found existing user (ORM). ID: ${existingUser.id}`); // Removed log
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle known Prisma errors
      if (error.code === 'P2002') {
        // Unique constraint violation (e.g., email already exists)
        console.error('Prisma P2002 error during user creation:', error);
        return NextResponse.json(
          { message: 'Database constraint violation: A user with this email likely already exists.' },
          { status: 400 }
        );
      }
      // Add handling for other specific Prisma errors if needed
      console.error('Unhandled Prisma Known Request Error:', error);
    }

    return NextResponse.json(
      { message: 'An unexpected error occurred while creating your account. Please try again.' },
      { status: 500 }
    );
  }
}
