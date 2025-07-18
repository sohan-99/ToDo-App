"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function AuthDebug() {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log("Auth debug - Session status:", status);
    console.log("Auth debug - Session data:", session);
  }, [session, status]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Auth Debug Page
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mb-6">
            <p className="mb-2 text-gray-700 dark:text-gray-300">
              <strong>Status:</strong> {status}
            </p>
            <p className="mb-2 text-gray-700 dark:text-gray-300">
              <strong>User:</strong> {session?.user?.name || "Not signed in"}
            </p>
            <p className="mb-2 text-gray-700 dark:text-gray-300">
              <strong>Email:</strong> {session?.user?.email || "N/A"}
            </p>
          </div>

          <div className="flex flex-col space-y-3">
            <Link
              href="/api/auth/signin"
              className="w-full flex justify-center py-2 px-4 border border-transparent 
                      rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 
                      hover:bg-blue-700 focus:outline-none focus:ring-2 
                      focus:ring-offset-2 focus:ring-blue-500 text-center"
            >
              Sign In
            </Link>

            <Link
              href="/api/auth/signout"
              className="w-full flex justify-center py-2 px-4 border border-transparent 
                      rounded-md shadow-sm text-sm font-medium text-white bg-red-600 
                      hover:bg-red-700 focus:outline-none focus:ring-2 
                      focus:ring-offset-2 focus:ring-red-500 text-center"
            >
              Sign Out
            </Link>

            <Link
              href="/"
              className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-medium text-center"
            >
              Return to home page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
