'use client';

import { useGetTodosQuery } from './api';

export default function TodoStats() {
  const { data } = useGetTodosQuery();

  if (!data) return null;

  const totalTasks = data.length;
  const completedTasks = data.filter(todo => todo.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex items-center animate-fade-in">
        <div className="rounded-full bg-indigo-100 dark:bg-indigo-900 p-3 mr-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-indigo-600 dark:text-indigo-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{totalTasks}</p>
        </div>
      </div>

      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex items-center animate-fade-in"
        style={{ animationDelay: '0.1s' }}
      >
        <div className="rounded-full bg-green-100 dark:bg-green-900 p-3 mr-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{completedTasks}</p>
        </div>
      </div>

      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex items-center animate-fade-in"
        style={{ animationDelay: '0.2s' }}
      >
        <div className="rounded-full bg-yellow-100 dark:bg-yellow-900 p-3 mr-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{pendingTasks}</p>
        </div>
      </div>

      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 sm:col-span-3 animate-fade-in"
        style={{ animationDelay: '0.3s' }}
      >
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Completion Rate</p>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
          <div
            className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
        <p className="text-right mt-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          {completionRate}%
        </p>
      </div>
    </div>
  );
}
