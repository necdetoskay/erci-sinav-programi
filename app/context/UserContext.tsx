"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type UserRole = "ADMIN" | "USER";
type UserStatus = "ACTIVE" | "INACTIVE";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
}

interface UpdateUserData {
  name?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
}

interface UserContextType {
  users: User[];
  addUser: (data: CreateUserData) => Promise<void>;
  updateUser: (id: number, data: UpdateUserData) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: "Admin User",
      email: "admin@example.com",
      role: "ADMIN",
      status: "ACTIVE",
    },
    {
      id: 2,
      name: "Regular User",
      email: "user@example.com",
      role: "USER",
      status: "ACTIVE",
    },
  ]);

  const addUser = async (data: CreateUserData) => {
    const newUser: User = {
      id: users.length + 1,
      ...data,
    };
    setUsers([...users, newUser]);
  };

  const updateUser = async (id: number, data: UpdateUserData) => {
    setUsers(
      users.map((user) =>
        user.id === id ? { ...user, ...data } : user
      )
    );
  };

  const deleteUser = async (id: number) => {
    setUsers(users.filter((user) => user.id !== id));
  };

  return (
    <UserContext.Provider
      value={{
        users,
        addUser,
        updateUser,
        deleteUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUsers() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUsers must be used within a UserProvider");
  }
  return context;
} 