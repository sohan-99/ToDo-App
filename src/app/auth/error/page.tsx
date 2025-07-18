"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function AuthError() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>(
    "An error occurred during authentication"
  );

  useEffect(() => {
    const error = searchParams.get("error");
    console.log("Auth error received:", error);

    if (error === "CredentialsSignin") {
      setErrorMessage("Invalid email or password");
    } else if (error === "OAuthAccountNotLinked") {
      setErrorMessage("The email is already used with another sign-in method");
    } else if (error === "EmailSignin") {
      setErrorMessage("The email could not be sent");
    } else if (error === "Configuration") {
      setErrorMessage("There is a problem with the server configuration");
    } else if (error === "AccessDenied") {
      setErrorMessage("You do not have access to this resource");
    } else if (error) {
      setErrorMessage(`Authentication error: ${error}`);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Authentication Error
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700 dark:text-red-400">{errorMessage}</p>
          </div>

          <div className="flex flex-col items-center space-y-4">
            <Link
              href="/auth/signin"
              className="w-full flex justify-center py-2 px-4 border border-transparent 
                       rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 
                       hover:bg-indigo-700 focus:outline-none focus:ring-2 
                       focus:ring-offset-2 focus:ring-indigo-500 text-center"
            >
              Try signing in again
            </Link>

            <Link
              href="/"
              className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-medium"
            >
              Return to home page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
