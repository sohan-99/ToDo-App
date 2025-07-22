'use client';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/models/user.interface';
import { useGetStatsQuery } from '@/features/todos/api';
import LoadingSpinner from '@/components/LoadingSpinner';
export default function DashboardPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role as UserRole;
  const { data: stats, isLoading, error } = useGetStatsQuery();
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
              userRole === 'super-admin'
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                : userRole === 'admin'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
            }`}
          >
            {userRole === 'super-admin'
              ? 'Super Administrator'
              : userRole === 'admin'
                ? 'Administrator'
                : 'User'}
          </span>
        </div>
        {(userRole === 'admin' || userRole === 'super-admin') && (
          <div className="mt-4 p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
            <h3 className="font-medium mb-2">Your Admin Permissions:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li className="text-green-600 dark:text-green-400">✓ View all users</li>
              <li className="text-green-600 dark:text-green-400">✓ Delete regular users</li>
              <li className="text-green-600 dark:text-green-400">✓ Update user information</li>
              {userRole === 'super-admin' ? (
                <>
                  <li className="text-green-600 dark:text-green-400">
                    ✓ Promote users to Admin/Super Admin
                  </li>
                  <li className="text-green-600 dark:text-green-400">✓ Delete Admin users</li>
                </>
              ) : (
                <>
                  <li className="text-red-600 dark:text-red-400">✗ Cannot promote users</li>
                  <li className="text-red-600 dark:text-red-400">
                    ✗ Cannot delete Admin/Super Admin users
                  </li>
                </>
              )}
            </ul>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-700 shadow-md rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Summary</h3>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-red-500 py-2">Failed to load stats</div>
          ) : stats ? (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Active Tasks</span>
                <span className="font-semibold">{stats.userStats.active}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed Tasks</span>
                <span className="font-semibold">{stats.userStats.completed}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending Tasks</span>
                <span className="font-semibold">{stats.userStats.pending}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Tasks</span>
                <span className="font-semibold">{stats.userStats.total}</span>
              </div>
            </div>
          ) : (
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
              <div className="flex justify-between">
                <span>Total Tasks</span>
                <span className="font-semibold">-</span>
              </div>
            </div>
          )}
        </div>
        {(userRole === 'admin' || userRole === 'super-admin') && (
          <div className="bg-white dark:bg-gray-700 shadow-md rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Admin Overview</h3>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="text-red-500 py-2">Failed to load stats</div>
            ) : stats?.adminStats ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Users</span>
                  <span className="font-semibold">{stats.adminStats.totalUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Tasks</span>
                  <span className="font-semibold">{stats.adminStats.totalTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span>System Status</span>
                  <span className="text-green-500 font-semibold">
                    {stats.adminStats.systemStatus}
                  </span>
                </div>
                {userRole === 'super-admin' && (
                  <div className="mt-4">
                    <a
                      href="/dashboard/admin/users"
                      className="text-blue-500 hover:text-blue-700 font-medium"
                    >
                      View All Users →
                    </a>
                  </div>
                )}
              </div>
            ) : (
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
                {userRole === 'super-admin' && (
                  <div className="mt-4">
                    <a
                      href="/dashboard/admin/users"
                      className="text-blue-500 hover:text-blue-700 font-medium"
                    >
                      View All Users →
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
