'use client';

import { useSession } from 'next-auth/react';
import { UserRole } from '@/models/User';

export default function DashboardPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role as UserRole;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="bg-white dark:bg-gray-700 shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Welcome, {session?.user?.name}!</h2>
        <div className="flex items-center space-x-2 mb-2">
          <span className="font-medium">Email:</span>
          <span>{session?.user?.email}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-medium">Role:</span>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              userRole === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
            }`}
          >
            {userRole === 'admin' ? 'Administrator' : 'User'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-700 shadow-md rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Active Tasks</span>
              <span className="font-semibold">-</span>
            </div>
            <div className="flex justify-between">
              <span>Completed Tasks</span>
              <span className="font-semibold">-</span>
            </div>
            <div className="flex justify-between">
              <span>Pending Tasks</span>
              <span className="font-semibold">-</span>
            </div>
          </div>
        </div>

        {userRole === 'admin' && (
          <div className="bg-white dark:bg-gray-700 shadow-md rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Admin Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total Users</span>
                <span className="font-semibold">-</span>
              </div>
              <div className="flex justify-between">
                <span>Total Tasks</span>
                <span className="font-semibold">-</span>
              </div>
              <div className="flex justify-between">
                <span>System Status</span>
                <span className="text-green-500 font-semibold">Active</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
