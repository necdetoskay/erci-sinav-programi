import bcrypt from "bcryptjs"; // Use bcryptjs
import { db } from "@/db"; // db is PrismaClient
import { Role } from "@prisma/client"; // Import the Role enum
// Remove unused Drizzle imports: schema, eq
// uuid is not needed if using Prisma's default ID generation (usually CUID or UUID)
// If you specifically need v4 UUIDs and your Prisma schema doesn't auto-generate them, keep this import.
// Assuming Prisma handles ID generation, removing uuidv4 import.

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds); // Use bcryptjs.hash
};

export type RegisterUserData = {
  name: string;
  email: string;
  password: string;
  role?: string; // Optional, defaults to "user" in schema
};

export const registerUser = async (userData: RegisterUserData) => {
  try {
    // Check if user already exists using Prisma
    const existingUser = await db.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash the password
    const hashedPassword = await hashPassword(userData.password);

    // Create a new user using Prisma
    // Prisma handles id, createdAt, updatedAt automatically based on schema
    const newUser = await db.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        // Use the Role enum from Prisma client
        role: userData.role ? (userData.role.toUpperCase() as Role) : Role.USER,
      },
    });

    // Return the user without the password
    // Prisma's create method returns the created object directly
    // We need to manually exclude the password if needed, although it's often better practice
    // not to select it in the first place if possible, or handle this at the API boundary.
    // For consistency with the original code's intent:
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};
