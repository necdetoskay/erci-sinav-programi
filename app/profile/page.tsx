import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ProfilePage() {
  const session = await auth();

  // If no session exists, redirect to login
  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-24">
      <div className="max-w-3xl w-full mx-auto p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold mb-8 text-center">Your Profile</h1>
        
        <div className="mb-8 bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 text-sm">User ID</p>
              <p className="font-medium">{session.user.id}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Name</p>
              <p className="font-medium">{session.user.name}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Email</p>
              <p className="font-medium">{session.user.email}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Role</p>
              <p className="font-medium capitalize">{session.user.role}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Link
            href="/"
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors duration-200"
          >
            Back to Home
          </Link>
          <form
            action={async () => {
              "use server";
              const { signOut } = await import("@/lib/auth");
              await signOut();
            }}
          >
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 