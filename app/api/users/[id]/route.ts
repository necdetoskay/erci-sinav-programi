import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// console.log("Compiling API route: /api/users/[id]/route.ts"); // Removed log

// Handler for DELETE /api/users/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  if (!id) {
    return NextResponse.json(
      { error: "User ID is required" },
      { status: 400 }
    );
  }

  try {
    // Attempt to delete the user by ID
    await prisma.user.delete({
      where: { id: id },
    });

    // console.log(`[API] Deleted user with ID: ${id}`); // Removed log
    // Return a success response with no content
    return new NextResponse(null, { status: 204 }); 

  } catch (error: any) {
    console.error(`Error deleting user with ID ${id}:`, error);

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
  const id = params.id;
  
  if (!id) {
    return NextResponse.json(
      { error: "User ID is required" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    // We only expect name, email, role for now based on UpdateUserData
    // Exclude fields that shouldn't be updated directly (like password here)
    const { name, email, role } = body; 

    // Basic validation (can be expanded with Zod if needed)
    if (!name && !email && !role) {
       return NextResponse.json(
        { error: "No update data provided" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: {
        name: name, // Update name if provided
        email: email, // Update email if provided
        role: role,   // Update role if provided
        // Add other updatable fields here if necessary
      },
      // Select the fields to return (excluding password)
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // console.log(`[API] Updated user with ID: ${id}`); // Removed log
    return NextResponse.json(updatedUser);

  } catch (error: any) {
    console.error(`Error updating user with ID ${id}:`, error);

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
