/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { RolePermissions } from '@/lib/permissions';
import { ITodo } from '@/types/todo';

interface AdminTodo extends ITodo {
  createdAt: string;
  updatedAt: string;
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export default function AdminTasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [todos, setTodos] = useState<AdminTodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    const userRole = session.user?.role;
    if (!RolePermissions.canManageAllTodos(userRole)) {
      router.push('/dashboard');
      return;
    }

    fetchTodos();
  }, [session, status, router, currentPage, searchTerm]);

  async function fetchTodos() {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams();
      searchParams.set('page', currentPage.toString());
      searchParams.set('limit', '20');
      if (searchTerm) {
        searchParams.set('search', searchTerm);
      }

      const response = await fetch(`/api/admin/todos?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setTodos(data.todos);
      setTotalPages(data.pagination.pages);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch todos');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    setDeleteLoading(id);
    try {
      const response = await fetch(`/api/admin/todos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Remove the deleted todo from the list
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete todo');
    } finally {
      setDeleteLoading(null);
    }
  }

  async function handleUpdate(id: string, completed?: boolean) {
    setUpdateLoading(id);
    try {
      const payload: { title?: string; completed?: boolean } = {};

      if (isEditing === id) {
        payload.title = editTitle;
      }

      if (completed !== undefined) {
        payload.completed = completed;
      }

      const response = await fetch(`/api/admin/todos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const updatedTodo = await response.json();

      // Update the todo in the list
      setTodos(todos.map(todo => (todo.id === id ? { ...todo, ...updatedTodo } : todo)));

      setIsEditing(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update todo');
    } finally {
      setUpdateLoading(null);
    }
  }

  function handleEdit(todo: AdminTodo) {
    setIsEditing(todo.id);
    setEditTitle(todo.title);
  }

  function cancelEdit() {
    setIsEditing(null);
  }

  if (status === 'loading' || (loading && !todos.length)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-200">Manage All Tasks</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-md w-full max-w-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          />
          <button
            onClick={() => fetchTodos()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : todos.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    No tasks found
                  </td>
                </tr>
              ) : (
                todos.map(todo => (
                  <tr key={todo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing === todo.id ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          className="px-2 py-1 border rounded-md w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                          autoFocus
                        />
                      ) : (
                        <span
                          className={`${todo.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}
                        >
                          {todo.title}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => handleUpdate(todo.id, !todo.completed)}
                          className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                          disabled={updateLoading === todo.id}
                        />
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          {todo.completed ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {todo.user ? (
                        <div>
                          <div>{todo.user.name}</div>
                          <div className="text-xs">{todo.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Unknown User</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(todo.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {isEditing === todo.id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdate(todo.id)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            disabled={updateLoading === todo.id}
                          >
                            {updateLoading === todo.id ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(todo)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(todo.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            disabled={deleteLoading === todo.id}
                          >
                            {deleteLoading === todo.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md ${
                currentPage === 1
                  ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'
              }`}
            >
              Previous
            </button>

            <div className="text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md ${
                currentPage === totalPages
                  ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
