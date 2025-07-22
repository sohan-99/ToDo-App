/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { UserRole, AdminPermissions } from '@/models/user.interface';

interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  adminPermissions?: AdminPermissions;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createUserData, setCreateUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as UserRole,
    adminPermissions: {
      canUpdateUserInfo: true,
      canDeleteUsers: false,
      canPromoteToAdmin: false,
      canDemoteAdmins: false,
    },
  });
  const [createLoading, setCreateLoading] = useState(false);

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
      // If changing role to admin, set default permissions
      const requestBody = {
        role: newRole,
        // Set default permissions when promoting to admin
        ...(newRole === 'admin'
          ? {
              adminPermissions: {
                canUpdateUserInfo: true, // Default: can update user info
                canDeleteUsers: false, // Default: cannot delete users
                canPromoteToAdmin: false, // Default: cannot promote users to admin
                canDemoteAdmins: false, // Default: cannot demote admins
              },
            }
          : {}),
      };

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user role');
      }

      // Update local state with proper permissions
      setUsers(prevUsers =>
        prevUsers.map(user => {
          if (user._id === userId) {
            return {
              ...user,
              role: newRole,
              // Set default permissions in the UI when promoting to admin
              ...(newRole === 'admin'
                ? {
                    adminPermissions: {
                      canUpdateUserInfo: true, // Default: can update user info
                      canDeleteUsers: false, // Default: cannot delete users
                      canPromoteToAdmin: false, // Default: cannot promote to admin
                      canDemoteAdmins: false, // Default: cannot demote admins
                    },
                  }
                : {}),
            };
          }
          return user;
        })
      );
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating role');
    }
  };

  // Handle editing user information (name/email)
  const handleUpdateUser = async (userId: string, userData: { name?: string; email?: string }) => {
    setUpdateLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user information');
      }

      // const updatedUser = await response.json();

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user => (user._id === userId ? { ...user, ...userData } : user))
      );

      // Close the edit mode
      setEditingUser(null);
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating user information');
    } finally {
      setUpdateLoading(false);
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

  // Handle creating a new user
  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: createUserData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create user');
      }

      const { user, message } = await response.json();

      // Check if the user was updated or created
      const isUpdated = message === 'User updated successfully';

      if (isUpdated) {
        // Update the existing user in the list
        setUsers(prevUsers => prevUsers.map(u => (u._id === user._id ? user : u)));
        setError('Existing user updated successfully');
      } else {
        // Add new user to the list
        setUsers(prevUsers => [user, ...prevUsers]);
        setError('User created successfully');
      }

      setTimeout(() => setError(null), 3000);

      // Reset form
      setCreateUserData({
        name: '',
        email: '',
        password: '',
        role: 'user' as UserRole,
        adminPermissions: {
          canUpdateUserInfo: true,
          canDeleteUsers: false,
          canPromoteToAdmin: false,
          canDemoteAdmins: false,
        },
      });
      setShowCreateForm(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the user');
    } finally {
      setCreateLoading(false);
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

  // Show error as a notification, not as full page replacement

  return (
    <div>
      {/* Error notification */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-2 sm:p-4 rounded-md mb-4 flex justify-between items-center">
          <p className="text-xs sm:text-sm text-red-700 dark:text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="text-gray-500 hover:text-gray-700 ml-2">
            &times;
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Manage Users</h1>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {selectedUsers.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={deleteLoading}
              className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteLoading ? 'Deleting...' : `Delete Selected (${selectedUsers.length})`}
            </button>
          )}

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {showCreateForm ? 'Cancel' : 'Create/Update User'}
          </button>
        </div>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-700 p-3 sm:p-4 rounded-md shadow-md mb-6 overflow-x-auto">
          <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4">Create or Update User</h2>
          <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
            If the email already exists, the user will be updated instead of creating a new one.
          </p>
          <form onSubmit={handleCreateUser} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={createUserData.name}
                  onChange={e => setCreateUserData({ ...createUserData, name: e.target.value })}
                  required
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-1.5 sm:py-2 px-2 sm:px-3 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={createUserData.email}
                  onChange={e => setCreateUserData({ ...createUserData, email: e.target.value })}
                  required
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={createUserData.password}
                  onChange={e => setCreateUserData({ ...createUserData, password: e.target.value })}
                  required
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Role
                </label>
                <select
                  id="role"
                  value={createUserData.role}
                  onChange={e => {
                    const newRole = e.target.value as UserRole;
                    setCreateUserData({
                      ...createUserData,
                      role: newRole,
                      // Clear admin permissions if role is not admin
                      adminPermissions:
                        newRole === 'admin'
                          ? createUserData.adminPermissions
                          : {
                              canUpdateUserInfo: true,
                              canDeleteUsers: false,
                              canPromoteToAdmin: false,
                              canDemoteAdmins: false,
                            },
                    });
                  }}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="user">User</option>
                  {/* Only super-admin or admin with canPromoteToAdmin permission can create admin users */}
                  {(session?.user?.role === 'super-admin' ||
                    (session?.user?.role === 'admin' &&
                      session?.user?.adminPermissions?.canPromoteToAdmin)) && (
                    <option value="admin">Admin</option>
                  )}
                  {/* Only super-admin can create super-admin users */}
                  {session?.user?.role === 'super-admin' && (
                    <option value="super-admin">Super Admin</option>
                  )}
                </select>
              </div>
            </div>

            {/* Admin Permissions Section */}
            {createUserData.role === 'admin' && (
              <div className="mt-3 sm:mt-4 border-t pt-3 sm:pt-4 border-gray-200 dark:border-gray-700">
                <h3 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Admin Permissions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={createUserData.adminPermissions.canUpdateUserInfo}
                      onChange={e =>
                        setCreateUserData({
                          ...createUserData,
                          adminPermissions: {
                            ...createUserData.adminPermissions,
                            canUpdateUserInfo: e.target.checked,
                          },
                        })
                      }
                      className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-gray-700 dark:bg-gray-800"
                    />
                    <span>Can update user info</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={createUserData.adminPermissions.canDeleteUsers}
                      onChange={e =>
                        setCreateUserData({
                          ...createUserData,
                          adminPermissions: {
                            ...createUserData.adminPermissions,
                            canDeleteUsers: e.target.checked,
                          },
                        })
                      }
                      className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-gray-700 dark:bg-gray-800"
                    />
                    <span>Can delete users</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={createUserData.adminPermissions.canPromoteToAdmin}
                      onChange={e =>
                        setCreateUserData({
                          ...createUserData,
                          adminPermissions: {
                            ...createUserData.adminPermissions,
                            canPromoteToAdmin: e.target.checked,
                          },
                        })
                      }
                      className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-gray-700 dark:bg-gray-800"
                    />
                    <span>Can promote to admin</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={createUserData.adminPermissions.canDemoteAdmins}
                      onChange={e =>
                        setCreateUserData({
                          ...createUserData,
                          adminPermissions: {
                            ...createUserData.adminPermissions,
                            canDemoteAdmins: e.target.checked,
                          },
                        })
                      }
                      className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-gray-700 dark:bg-gray-800"
                    />
                    <span>Can demote admins</span>
                  </label>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createLoading}
                className="inline-flex justify-center py-1.5 sm:py-2 px-3 sm:px-4 border border-transparent shadow-sm text-xs sm:text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createLoading ? 'Processing...' : 'Save User'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-700 shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-auto">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <input
                  type="checkbox"
                  onChange={e => {
                    if (e.target.checked) {
                      setSelectedUsers(users.map(user => user._id));
                    } else {
                      setSelectedUsers([]);
                    }
                  }}
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-gray-700 dark:bg-gray-800"
                />
              </th>
              <th className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                Email
              </th>
              <th className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                Joined
              </th>
              <th className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                Permissions
              </th>
              <th className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            {users.map(user => (
              <tr key={user._id}>
                <td className="px-2 sm:px-3 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => toggleUserSelection(user._id)}
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-gray-700 dark:bg-gray-800"
                  />
                </td>
                <td className="px-2 sm:px-3 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                  {editingUser?.id === user._id ? (
                    <input
                      type="text"
                      value={editingUser.name}
                      onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                      className="w-full p-1 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 dark:text-white"
                    />
                  ) : (
                    <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                      {user.name}
                      <div className="md:hidden text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {user.email}
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-2 sm:px-3 md:px-6 py-2 sm:py-4 whitespace-nowrap hidden md:table-cell">
                  {editingUser?.id === user._id ? (
                    <input
                      type="email"
                      value={editingUser.email}
                      onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="w-full p-1 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 dark:text-white"
                    />
                  ) : (
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                      {user.email}
                    </div>
                  )}
                </td>
                <td className="px-2 sm:px-3 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-1.5 sm:px-2 md:px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                <td className="px-2 sm:px-3 md:px-6 py-2 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-2 sm:px-3 md:px-6 py-2 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                  {user.role === 'super-admin' ? (
                    <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                      Full Access
                    </div>
                  ) : user.role === 'admin' ? (
                    <div className="flex flex-col gap-0.5 sm:gap-1">
                      <span
                        className={`text-xs ${user.adminPermissions?.canUpdateUserInfo ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}
                      >
                        {user.adminPermissions?.canUpdateUserInfo ? '✓' : '✗'}{' '}
                        <span className="hidden sm:inline">Can update user info</span>
                        <span className="inline sm:hidden">Update info</span>
                      </span>
                      <span
                        className={`text-xs ${user.adminPermissions?.canDeleteUsers ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}
                      >
                        {user.adminPermissions?.canDeleteUsers ? '✓' : '✗'}{' '}
                        <span className="hidden sm:inline">Can delete users</span>
                        <span className="inline sm:hidden">Delete users</span>
                      </span>
                      <span
                        className={`text-xs ${user.adminPermissions?.canPromoteToAdmin ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}
                      >
                        {user.adminPermissions?.canPromoteToAdmin ? '✓' : '✗'}{' '}
                        <span className="hidden sm:inline">Can promote to admin</span>
                        <span className="inline sm:hidden">Promote to admin</span>
                      </span>
                      <span
                        className={`text-xs ${user.adminPermissions?.canDemoteAdmins ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}
                      >
                        {user.adminPermissions?.canDemoteAdmins ? '✓' : '✗'}{' '}
                        <span className="hidden sm:inline">Can demote admins</span>
                        <span className="inline sm:hidden">Demote admins</span>
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500">Standard user</span>
                  )}
                </td>
                <td className="px-2 sm:px-3 md:px-6 py-2 sm:py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1 sm:space-x-2">
                    {editingUser?.id === user._id ? (
                      <>
                        <button
                          onClick={() =>
                            handleUpdateUser(user._id, {
                              name: editingUser.name,
                              email: editingUser.email,
                            })
                          }
                          disabled={updateLoading}
                          className="px-1.5 sm:px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                        >
                          {updateLoading ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="px-1.5 sm:px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <select
                          value={user.role}
                          onChange={e => handleRoleChange(user._id, e.target.value as UserRole)}
                          className="block w-full px-1 sm:px-2 py-1 text-xs sm:text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                          disabled={
                            user._id === session?.user?.id || // Can't change own role
                            // Admins can only change roles if they have permissions
                            (session?.user?.role === 'admin' &&
                              !(
                                // Can promote user to admin if they have permission
                                (
                                  (user.role === 'user' &&
                                    session?.user?.adminPermissions?.canPromoteToAdmin) ||
                                  // Can demote admin to user if they have permission
                                  (user.role === 'admin' &&
                                    session?.user?.adminPermissions?.canDemoteAdmins)
                                )
                              ))
                          }
                        >
                          <option value="user">User</option>
                          {/* Show Admin option for super-admins or admins with promotion permission */}
                          {(session?.user?.role === 'super-admin' ||
                            (session?.user?.role === 'admin' &&
                              session?.user?.adminPermissions?.canPromoteToAdmin)) && (
                            <option value="admin">Admin</option>
                          )}
                          {/* Only super-admins can make super-admins */}
                          {session?.user?.role === 'super-admin' && (
                            <option value="super-admin">Super Admin</option>
                          )}
                        </select>

                        {/* Admin permissions settings - only visible for super-admin when viewing admin users */}
                        {session?.user?.role === 'super-admin' && user.role === 'admin' && (
                          <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                            <div className="font-medium mb-1 text-xs">Admin Permissions:</div>
                            {/* Quick Permission Presets */}
                            <div className="flex flex-wrap gap-2 mb-2">
                              <button
                                onClick={async () => {
                                  try {
                                    const response = await fetch(`/api/admin/users/${user._id}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        adminPermissions: {
                                          canUpdateUserInfo: true,
                                          canDeleteUsers: false,
                                          canPromoteToAdmin: false,
                                          canDemoteAdmins: false,
                                        },
                                      }),
                                    });

                                    if (!response.ok) {
                                      throw new Error('Failed to update permissions');
                                    }

                                    setUsers(prevUsers =>
                                      prevUsers.map(u =>
                                        u._id === user._id
                                          ? {
                                              ...u,
                                              adminPermissions: {
                                                canUpdateUserInfo: true,
                                                canDeleteUsers: false,
                                                canPromoteToAdmin: false,
                                                canDemoteAdmins: false,
                                              },
                                            }
                                          : u
                                      )
                                    );

                                    setError('Set to Edit-only permissions');
                                    setTimeout(() => setError(null), 3000);
                                  } catch (err: any) {
                                    setError(err.message || 'Failed to update permissions');
                                  }
                                }}
                                className="px-1.5 py-0.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 whitespace-nowrap"
                              >
                                Edit-only
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    const response = await fetch(`/api/admin/users/${user._id}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        adminPermissions: {
                                          canUpdateUserInfo: true,
                                          canDeleteUsers: true,
                                          canPromoteToAdmin: true,
                                          canDemoteAdmins: true,
                                        },
                                      }),
                                    });

                                    if (!response.ok) {
                                      throw new Error('Failed to update permissions');
                                    }

                                    setUsers(prevUsers =>
                                      prevUsers.map(u =>
                                        u._id === user._id
                                          ? {
                                              ...u,
                                              adminPermissions: {
                                                canUpdateUserInfo: true,
                                                canDeleteUsers: true,
                                                canPromoteToAdmin: true,
                                                canDemoteAdmins: true,
                                              },
                                            }
                                          : u
                                      )
                                    );

                                    setError('Set to Full Access permissions');
                                    setTimeout(() => setError(null), 3000);
                                  } catch (err: any) {
                                    setError(err.message || 'Failed to update permissions');
                                  }
                                }}
                                className="px-1.5 py-0.5 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 whitespace-nowrap"
                              >
                                Full Access
                              </button>
                            </div>
                            <div className="flex flex-col space-y-1">
                              <label className="flex items-center text-xs">
                                <input
                                  type="checkbox"
                                  checked={user.adminPermissions?.canUpdateUserInfo ?? true}
                                  onChange={async e => {
                                    try {
                                      const response = await fetch(`/api/admin/users/${user._id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          adminPermissions: {
                                            ...(user.adminPermissions || {}),
                                            canUpdateUserInfo: e.target.checked,
                                            // Keep other permissions as is
                                            canDeleteUsers:
                                              user.adminPermissions?.canDeleteUsers || false,
                                            canPromoteToAdmin:
                                              user.adminPermissions?.canPromoteToAdmin || false,
                                            canDemoteAdmins:
                                              user.adminPermissions?.canDemoteAdmins || false,
                                          },
                                        }),
                                      });

                                      if (!response.ok) {
                                        throw new Error('Failed to update permissions');
                                      }

                                      // Show a temporary success message
                                      setError(
                                        `Successfully ${e.target.checked ? 'granted' : 'removed'} permission to update user info`
                                      );
                                      setTimeout(() => setError(null), 3000);

                                      // Update local state
                                      setUsers(prevUsers =>
                                        prevUsers.map(u =>
                                          u._id === user._id
                                            ? {
                                                ...u,
                                                adminPermissions: {
                                                  canUpdateUserInfo: e.target.checked,
                                                  canDeleteUsers:
                                                    u.adminPermissions?.canDeleteUsers || false,
                                                  canPromoteToAdmin:
                                                    u.adminPermissions?.canPromoteToAdmin || false,
                                                  canDemoteAdmins:
                                                    u.adminPermissions?.canDemoteAdmins || false,
                                                },
                                              }
                                            : u
                                        )
                                      );
                                    } catch (err: any) {
                                      setError(err.message || 'Failed to update admin permissions');
                                    }
                                  }}
                                  className="mr-2 h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-gray-700 dark:bg-gray-800"
                                />
                                <span>Can update user info</span>
                              </label>
                              <label className="flex items-center text-xs">
                                <input
                                  type="checkbox"
                                  checked={user.adminPermissions?.canDeleteUsers ?? false}
                                  onChange={async e => {
                                    try {
                                      const response = await fetch(`/api/admin/users/${user._id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          adminPermissions: {
                                            ...(user.adminPermissions || {}),
                                            // Preserve the existing setting for updating user info
                                            canUpdateUserInfo:
                                              user.adminPermissions?.canUpdateUserInfo || true,
                                            canDeleteUsers: e.target.checked,
                                            canPromoteToAdmin:
                                              user.adminPermissions?.canPromoteToAdmin || false,
                                            canDemoteAdmins:
                                              user.adminPermissions?.canDemoteAdmins || false,
                                          },
                                        }),
                                      });

                                      if (!response.ok) {
                                        throw new Error('Failed to update permissions');
                                      }

                                      // Show a temporary success message
                                      setError(
                                        `Successfully ${e.target.checked ? 'granted' : 'removed'} permission to delete users`
                                      );
                                      setTimeout(() => setError(null), 3000);

                                      // Update local state
                                      setUsers(prevUsers =>
                                        prevUsers.map(u =>
                                          u._id === user._id
                                            ? {
                                                ...u,
                                                adminPermissions: {
                                                  canUpdateUserInfo:
                                                    u.adminPermissions?.canUpdateUserInfo || true,
                                                  canDeleteUsers: e.target.checked,
                                                  canPromoteToAdmin:
                                                    u.adminPermissions?.canPromoteToAdmin || false,
                                                  canDemoteAdmins:
                                                    u.adminPermissions?.canDemoteAdmins || false,
                                                },
                                              }
                                            : u
                                        )
                                      );
                                    } catch (err: any) {
                                      setError(err.message || 'Failed to update admin permissions');
                                    }
                                  }}
                                  className="mr-2 h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-gray-700 dark:bg-gray-800"
                                />
                                <span>Can delete users</span>
                              </label>

                              <label className="flex items-center text-xs">
                                <input
                                  type="checkbox"
                                  checked={user.adminPermissions?.canPromoteToAdmin ?? false}
                                  onChange={async e => {
                                    try {
                                      const response = await fetch(`/api/admin/users/${user._id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          adminPermissions: {
                                            ...(user.adminPermissions || {}),
                                            canUpdateUserInfo:
                                              user.adminPermissions?.canUpdateUserInfo || true,
                                            canDeleteUsers:
                                              user.adminPermissions?.canDeleteUsers || false,
                                            canPromoteToAdmin: e.target.checked,
                                            canDemoteAdmins:
                                              user.adminPermissions?.canDemoteAdmins || false,
                                          },
                                        }),
                                      });

                                      if (!response.ok) {
                                        throw new Error('Failed to update permissions');
                                      }

                                      // Show a temporary success message
                                      setError(
                                        `Successfully ${e.target.checked ? 'granted' : 'removed'} permission to promote users to admin`
                                      );
                                      setTimeout(() => setError(null), 3000);

                                      // Update local state
                                      setUsers(prevUsers =>
                                        prevUsers.map(u =>
                                          u._id === user._id
                                            ? {
                                                ...u,
                                                adminPermissions: {
                                                  canUpdateUserInfo:
                                                    u.adminPermissions?.canUpdateUserInfo || true,
                                                  canDeleteUsers:
                                                    u.adminPermissions?.canDeleteUsers || false,
                                                  canPromoteToAdmin: e.target.checked,
                                                  canDemoteAdmins:
                                                    u.adminPermissions?.canDemoteAdmins || false,
                                                },
                                              }
                                            : u
                                        )
                                      );
                                    } catch (err: any) {
                                      setError(err.message || 'Failed to update admin permissions');
                                    }
                                  }}
                                  className="mr-2 h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-gray-700 dark:bg-gray-800"
                                />
                                <span>Can promote to admin</span>
                              </label>

                              <label className="flex items-center text-xs">
                                <input
                                  type="checkbox"
                                  checked={user.adminPermissions?.canDemoteAdmins ?? false}
                                  onChange={async e => {
                                    try {
                                      const response = await fetch(`/api/admin/users/${user._id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          adminPermissions: {
                                            ...(user.adminPermissions || {}),
                                            canUpdateUserInfo:
                                              user.adminPermissions?.canUpdateUserInfo || true,
                                            canDeleteUsers:
                                              user.adminPermissions?.canDeleteUsers || false,
                                            canPromoteToAdmin:
                                              user.adminPermissions?.canPromoteToAdmin || false,
                                            canDemoteAdmins: e.target.checked,
                                          },
                                        }),
                                      });

                                      if (!response.ok) {
                                        throw new Error('Failed to update permissions');
                                      }

                                      // Show a temporary success message
                                      setError(
                                        `Successfully ${e.target.checked ? 'granted' : 'removed'} permission to demote admins`
                                      );
                                      setTimeout(() => setError(null), 3000);

                                      // Update local state
                                      setUsers(prevUsers =>
                                        prevUsers.map(u =>
                                          u._id === user._id
                                            ? {
                                                ...u,
                                                adminPermissions: {
                                                  canUpdateUserInfo:
                                                    u.adminPermissions?.canUpdateUserInfo || true,
                                                  canDeleteUsers:
                                                    u.adminPermissions?.canDeleteUsers || false,
                                                  canPromoteToAdmin:
                                                    u.adminPermissions?.canPromoteToAdmin || false,
                                                  canDemoteAdmins: e.target.checked,
                                                },
                                              }
                                            : u
                                        )
                                      );
                                    } catch (err: any) {
                                      setError(err.message || 'Failed to update admin permissions');
                                    }
                                  }}
                                  className="mr-2 h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-gray-700 dark:bg-gray-800"
                                />
                                <span>Can demote admins</span>
                              </label>
                            </div>
                          </div>
                        )}

                        {(session?.user?.role === 'super-admin' ||
                          (session?.user?.role === 'admin' &&
                            session?.user?.adminPermissions?.canUpdateUserInfo)) && (
                          <button
                            onClick={() =>
                              setEditingUser({
                                id: user._id,
                                name: user.name,
                                email: user.email,
                              })
                            }
                            className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Edit user information"
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
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteUser(user._id, user.role)}
                          disabled={
                            user._id === session?.user?.id || // Can't delete self
                            (user.role === 'admin' && session?.user?.role !== 'super-admin') || // Only super-admin can delete admins
                            (user.role === 'super-admin' &&
                              session?.user?.role !== 'super-admin') || // Only super-admin can delete super-admins
                            (session?.user?.role === 'admin' &&
                              !session?.user?.adminPermissions?.canDeleteUsers) // Admin without delete permission
                          }
                          className="ml-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={
                            user._id === session?.user?.id
                              ? 'Cannot delete your own account'
                              : user.role === 'admin' && session?.user?.role !== 'super-admin'
                                ? 'Only Super Admins can delete Admins'
                                : user.role === 'super-admin' &&
                                    session?.user?.role !== 'super-admin'
                                  ? 'Only Super Admins can delete Super Admins'
                                  : session?.user?.role === 'admin' &&
                                      !session?.user?.adminPermissions?.canDeleteUsers
                                    ? 'You do not have permission to delete users'
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
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
