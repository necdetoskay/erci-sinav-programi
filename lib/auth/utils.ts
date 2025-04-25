import bcrypt from "bcrypt";
import { db } from "@/db";
import { schema } from "@/db";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

export type RegisterUserData = {
  name: string;
  email: string;
  password: string;
  role?: string; // Optional, defaults to "user" in schema
};

export const registerUser = async (userData: RegisterUserData) => {
  try {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, userData.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error("User with this email already exists");
    }

    // Hash the password
    const hashedPassword = await hashPassword(userData.password);

    // Create a new user
    const newUser = await db.insert(schema.users).values({
      id: uuidv4(),
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role || "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // Return the user without the password
    const { password, ...userWithoutPassword } = newUser[0];
    return userWithoutPassword;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
}; 