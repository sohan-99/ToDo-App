/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { UserRole } from '@/models/user.interface';
import { RolePermissions } from '@/lib/permissions';

interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (
      status === 'authenticated' &&
      session?.user?.role !== 'admin' &&
      session?.user?.role !== 'super-admin'
    ) {
      router.push('/dashboard');
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
        setLoading(false);
      }
    };

    if (
      status === 'authenticated' &&
      (session?.user?.role === 'admin' || session?.user?.role === 'super-admin')
    ) {
      fetchUsers();
    }
  }, [status, session, router]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user role');
      }

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user => (user._id === userId ? { ...user, role: newRole } : user))
      );
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating role');
    }
  };

  const handleDeleteUser = async (userId: string, userRole: UserRole) => {
    // Check if current user has permission to delete this user based on role
    const canDelete =
      userRole === 'user' ||
      (userRole === 'admin' && session?.user?.role === 'super-admin') ||
      (userRole === 'super-admin' && session?.user?.role === 'super-admin');

    if (!canDelete) {
      setError(
        `You don't have permission to delete ${userRole === 'admin' ? 'an admin' : 'a super admin'}`
      );
      return;
    }

    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      // Remove user from the list
      setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
    } catch (err: any) {
      setError(err.message || 'An error occurred while deleting the user');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) {
      setError('No users selected');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds: selectedUsers }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete users');
      }

      // Remove deleted users from the list
      setUsers(prevUsers => prevUsers.filter(user => !selectedUsers.includes(user._id)));
      setSelectedUsers([]);
    } catch (err: any) {
      setError(err.message || 'An error occurred while deleting users');
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-md my-4">
        <p className="text-red-700 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Users</h1>

        {selectedUsers.length > 0 && (
          <button
            onClick={handleBulkDelete}
            disabled={deleteLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleteLoading ? 'Deleting...' : `Delete Selected (${selectedUsers.length})`}
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-700 shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <input
                  type="checkbox"
                  onChange={e => {
                    if (e.target.checked) {
                      setSelectedUsers(users.map(user => user._id));
                    } else {
                      setSelectedUsers([]);
                    }
                  }}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-gray-700 dark:bg-gray-800"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            {users.map(user => (
              <tr key={user._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => toggleUserSelection(user._id)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-gray-700 dark:bg-gray-800"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-300">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'super-admin'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        : user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-300">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap flex items-center space-x-2">
                  <select
                    value={user.role}
                    onChange={e => handleRoleChange(user._id, e.target.value as UserRole)}
                    className="block w-full px-2 py-1 text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                    disabled={
                      user._id === session?.user?.id || // Can't change own role
                      session?.user?.role === 'admin' // Admins can't change roles
                    }
                  >
                    <option value="user">User</option>
                    {session?.user?.role === 'super-admin' && (
                      <>
                        <option value="admin">Admin</option>
                        <option value="super-admin">Super Admin</option>
                      </>
                    )}
                  </select>

                  <button
                    onClick={() => handleDeleteUser(user._id, user.role)}
                    disabled={
                      user._id === session?.user?.id || // Can't delete self
                      (user.role === 'admin' && session?.user?.role !== 'super-admin') || // Only super-admin can delete admins
                      (user.role === 'super-admin' && session?.user?.role !== 'super-admin') // Only super-admin can delete super-admins
                    }
                    className="ml-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={
                      user._id === session?.user?.id
                        ? 'Cannot delete your own account'
                        : user.role === 'admin' && session?.user?.role !== 'super-admin'
                          ? 'Only Super Admins can delete Admins'
                          : user.role === 'super-admin' && session?.user?.role !== 'super-admin'
                            ? 'Only Super Admins can delete Super Admins'
                            : 'Delete user'
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
