"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUsers } from "@/app/context/UserContext"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }).optional(),
  role: z.enum(["ADMIN", "USER"]),
  // status: z.enum(["ACTIVE", "INACTIVE"]), // Removed status from schema
})

type UserFormValues = z.infer<typeof formSchema>

// Define User type based on what the form actually uses/needs
// Match the User type from UserContext if possible, but ensure ID is string
interface UserFormData {
    id: string; // Changed to string
    name: string | null; // Match UserContext
    email: string;
    role: string; // Accept any role string
    // status: "ACTIVE" | "INACTIVE"; // Removed status
}

interface UserFormProps {
  initialData?: UserFormData // Use the defined type
}

export function UserForm({ initialData }: UserFormProps) {
  const { addUser, updateUser } = useUsers()
  const router = useRouter()

  // Initialize the form with react-hook-form
  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    // Adjust defaultValues to handle potential null name and ensure type consistency
    defaultValues: initialData
      ? {
          name: initialData.name ?? "", // Use nullish coalescing for name
          email: initialData.email,
          role: initialData.role === "PERSONEL" ? "USER" : initialData.role as "ADMIN" | "USER",
          // password is not set for initialData (edit mode)
        }
      : { // Default values for new user form
          name: "",
          email: "",
          password: "",
          role: "USER",
        },
  })

  async function onSubmit(data: UserFormValues) {
    try {
      if (initialData) {
        // Pass string ID and relevant data to updateUser
        await updateUser(initialData.id, {
          name: data.name,
          email: data.email,
          role: data.role,
          // status: data.status // Removed status
        });
        // toast is handled in updateUser context function
        // toast.success("User updated successfully");
      } else {
        // Add user logic (ensure CreateUserData matches context)
        if (!data.password) {
          toast.error("Password is required for new users")
          return
        }
        // Ensure the data passed matches CreateUserData expected by context
        // Note: addUser in context is currently a placeholder
        await addUser({
          name: data.name,
          email: data.email,
          password: data.password, // Password is required here
          role: data.role,
          // status: data.status, // Removed status
        });
        // toast is handled in addUser context function (currently a warning)
        // toast.success("User created successfully");
      }
      router.push("/users"); // Navigate back after submit
    } catch (error) {
      // Error toast is handled in context functions
      // toast.error("Something went wrong");
      console.error("Error during form submission:", error); // Keep console log
    }
  }

  return (
    // Correctly pass the form object to the Form component
    <Form form={form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter user name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter user email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!initialData && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Removed Status FormField */}
        <Button type="submit">
          {initialData ? "Update User" : "Create User"}
        </Button>
      </form>
    </Form>
  )
}
