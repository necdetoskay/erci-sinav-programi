"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react"; // Added useEffect
import { toast } from "sonner"; // Import toast for error notifications

type UserRole = "ADMIN" | "USER";
// Assuming Status enum is defined elsewhere or imported if needed by API response
// If not, adjust User interface based on actual API response structure
type UserStatus = "ACTIVE" | "INACTIVE" | "DELETED"; // Match potential statuses

// Updated User interface to match API response (string ID, createdAt, updatedAt)
export interface User {
  id: string; // Changed from number to string based on API route
  name: string | null; // Allow null based on API route select
  email: string;
  role: UserRole;
  // status: UserStatus; // This was already commented out, ensuring it's fully removed if present elsewhere
  createdAt: string; // Changed from Date to string (JSON conversion)
  updatedAt: string; // Changed from Date to string (JSON conversion)
}

// Double-checking CreateUserData and UpdateUserData interfaces

// Keep CreateUserData and UpdateUserData for potential future API calls
interface CreateUserData {
  name: string;
  email: string;
  password: string; // Password might be needed for POST /api/users
  role: UserRole;
  // status: UserStatus; // Removed status as it's not on the User model
}

interface UpdateUserData {
  name?: string | null; // Allow null to match User model
  email?: string;
  role?: UserRole;
  // status?: UserStatus; // Removed status
}

interface UserContextType {
  users: User[];
  isLoading: boolean; // Add loading state
  fetchUsers: () => Promise<void>; // Expose fetch function for potential refresh
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

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users'); // Fetch from the API route
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

  // --- Placeholder functions - Need API integration ---
  // These currently only modify local state and will be out of sync
  const addUser = async (data: CreateUserData) => {
     toast.warning("Add user functionality is not fully implemented with API.");
    // Placeholder: Add locally for immediate UI feedback (needs API call)
    const newUser: User = {
      id: `temp-${Date.now()}`, // Temporary ID
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
      name: data.name, 
      email: data.email, // Added email for consistency
      role: data.role,   // Added role for consistency
      // password should not be stored in frontend state
      // status is removed
    };
    setUsers((prev) => [...prev, newUser]);
     // TODO: Add API call to POST /api/users and update state with real user/ID
     // Ensure the actual API call sends the correct data structure (name, email, password, role)
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
