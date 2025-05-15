"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { User, UserRole, CreateUserData, UpdateUserData } from "@/app/types";

interface UserContextType {
  users: User[];
  isLoading: boolean; // Add loading state
  fetchUsers: (searchTerm?: string, roleFilter?: string) => Promise<void>; // Expose fetch function with search and filter params
  // Keep add/update/delete for now, but they need API integration later
  addUser: (data: CreateUserData) => Promise<void>;
  updateUser: (id: string, data: UpdateUserData) => Promise<void>; // ID is string now
  deleteUser: (id: string) => Promise<void>; // ID is string now
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [users, setUsers] = useState<User[]>([]); // Initialize empty
  const [isLoading, setIsLoading] = useState<boolean>(true); // Loading state

  const fetchUsers = async (searchTerm?: string, roleFilter?: string) => {
    setIsLoading(true);
    try {
      // URL parametrelerini oluştur
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter && roleFilter !== 'ALL') params.append('role', roleFilter);

      // API'ye istek gönder
      const url = `/api/users${params.toString() ? `?${params.toString()}` : ''}`;
      console.log("Fetching users from:", url);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data: User[] = await response.json();
      setUsers(data); // Update state with fetched users
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users from the server.");
      setUsers([]); // Clear users on error
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch users when the component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  // API ile kullanıcı ekleme
  const addUser = async (data: CreateUserData) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorDetails = 'Failed to add user.';
        try {
          const errorData = await response.json();
          errorDetails = errorData.error || errorDetails;
        } catch (e) {
          // Ignore if response body is not JSON
        }
        throw new Error(errorDetails);
      }

      const newUser: User = await response.json();

      // Kullanıcı listesini güncelle
      setUsers((prev) => [...prev, newUser]);
      toast.success("Kullanıcı başarıyla eklendi.");

    } catch (error) {
      console.error("Error adding user:", error);
      toast.error(error instanceof Error ? error.message : "Kullanıcı eklenirken bir hata oluştu.");
    }
  };

  // Updated updateUser function to call the API
  const updateUser = async (id: string, data: UpdateUserData) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data), // Send updated data
      });

      if (!response.ok) {
        let errorDetails = 'Failed to update user.';
        try {
          const errorData = await response.json();
          errorDetails = errorData.error || errorDetails;
        } catch (e) {
          // Ignore if response body is not JSON
        }
        throw new Error(errorDetails);
      }

      const updatedUserFromServer: User = await response.json();

      // Update local state with the user data returned from the server
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === id ? updatedUserFromServer : user
        )
      );
      toast.success("User updated successfully.");

    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(error instanceof Error ? error.message : "An unknown error occurred while updating the user.");
      // Optionally re-fetch users to ensure consistency if update fails
      // fetchUsers();
    }
  };

  // Updated deleteUser function to call the API
  const deleteUser = async (id: string) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Try to get error details from response body
        let errorDetails = 'Failed to delete user.';
        try {
          const errorData = await response.json();
          errorDetails = errorData.error || errorDetails;
        } catch (e) {
          // Ignore if response body is not JSON or empty
        }
        throw new Error(errorDetails);
      }

      // If API call is successful, update the local state
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
      toast.success("User deleted successfully.");

    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(error instanceof Error ? error.message : "An unknown error occurred while deleting the user.");
      // Optionally re-fetch users to ensure consistency if delete fails
      // fetchUsers();
    }
  };
  // --- End Placeholder functions ---


  return (
    <UserContext.Provider
      value={{
        users,
        isLoading,
        fetchUsers, // Provide fetch function
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
