import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Corrected: Use named import
import { hash } from "bcryptjs";
import { Status } from "@prisma/client";

// Tüm kullanıcıları getir
export async function GET() {
  try {
    // Fetch all users (removed status filter as it doesn't exist on User model)
    const users = await prisma.user.findMany({
      // where: { // Removed status filter
      //   status: Status.ACTIVE, 
      // },
      select: { // Removed status field
        id: true,
        name: true,
        email: true,
        role: true,
        // status: true, 
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(users);
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
    const { name, email, password } = await request.json();

    const requiredFields = ["name", "email", "password"];
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

    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
