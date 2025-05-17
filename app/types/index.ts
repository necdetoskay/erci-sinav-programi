// Ortak tip tanımlamaları

// Kullanıcı rolleri
export type UserRole = "ADMIN" | "USER" | "PERSONEL" | "SUPERADMIN";

// Kullanıcı durumu
export type UserStatus = "ACTIVE" | "INACTIVE";

// Temel kullanıcı tipi
export interface User {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  emailVerified: string | null;
  createdAt: string;
  updatedAt?: string;
}

// Kullanıcı oluşturma için gerekli veriler
export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

// Kullanıcı güncelleme için gerekli veriler
export interface UpdateUserData {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  emailVerified?: boolean;
}

// Rol tipi
export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  userCount: number;
  isSystemRole?: boolean;
}
