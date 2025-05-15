"use client";

import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface UserSelectorProps {
  selectedUserId: string | null;
  onUserChange: (userId: string) => void;
}

export const UserSelector = ({ selectedUserId, onUserChange }: UserSelectorProps) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Kullanıcıları yükle
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Sadece ADMIN ve SUPERADMIN rollerine sahip kullanıcıları getir
        const response = await fetch('/api/admin/users?role=ADMIN,SUPERADMIN');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();

        // Sadece ADMIN ve SUPERADMIN rollerine sahip kullanıcıları filtrele
        const filteredUsers = data.users.filter(
          (u: User) => u.role === 'ADMIN' || u.role === 'SUPERADMIN'
        );

        setUsers(filteredUsers);

        // Eğer seçili kullanıcı yoksa ve kullanıcı listesi doluysa, mevcut kullanıcıyı seç
        if (!selectedUserId && filteredUsers.length > 0 && user?.id) {
          onUserChange(user.id);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Kullanıcılar yüklenirken bir hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };

    // Sadece SUPERADMIN veya ADMIN rolündeki kullanıcılar için kullanıcıları getir
    if (user?.role === 'SUPERADMIN' || user?.role === 'ADMIN') {
      fetchUsers();
    } else {
      setIsLoading(false);
    }
  }, [user, selectedUserId, onUserChange]);

  // Sadece SUPERADMIN veya ADMIN rolündeki kullanıcılar için göster
  if (user?.role !== 'SUPERADMIN' && user?.role !== 'ADMIN') {
    return null;
  }

  // ADMIN kullanıcısı sadece kendi ayarlarını görebilir
  if (user?.role === 'ADMIN') {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center space-x-2">
        <label htmlFor="user-selector" className="text-sm font-medium text-foreground">
          Kullanıcı Seç:
        </label>
        {isLoading ? (
          <div className="flex items-center">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Kullanıcılar yükleniyor...</span>
          </div>
        ) : error ? (
          <span className="text-sm text-red-500">{error}</span>
        ) : (
          <Select
            value={selectedUserId || ''}
            onValueChange={(value) => {
              console.log(`User selector value changed to: ${value}`);
              onUserChange(value);
            }}
          >
            <SelectTrigger id="user-selector" className="w-[250px]">
              <SelectValue placeholder="Kullanıcı seçin" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name || user.email} ({user.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};
