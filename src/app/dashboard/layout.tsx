'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      <aside className="w-64 bg-gray-100 dark:bg-gray-900 p-4 min-h-screen">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Dashboard</h2>
        <nav>
          <ul className="space-y-2">
            <li>
              <a
                href="/dashboard"
                className="block p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                Overview
              </a>
            </li>
            <li>
              <a
                href="/dashboard/todos"
                className="block p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                My Tasks
              </a>
            </li>
            {(session?.user.role === 'admin' || session?.user.role === 'super-admin') && (
              <>
                <li className="pt-4 border-t border-gray-300 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Admin
                  </h3>
                </li>
                <li>
                  <a
                    href="/dashboard/admin/users"
                    className="block p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    {session?.user.role === 'super-admin' ? 'All Users' : 'Manage Users'}
                  </a>
                </li>
                <li>
                  <a
                    href="/dashboard/admin/tasks"
                    className="block p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    Manage All Tasks
                  </a>
                </li>
              </>
            )}
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-white dark:bg-gray-800">{children}</main>
    </div>
  );
}
