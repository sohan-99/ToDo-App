/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useSession } from 'next-auth/react';
import ToDoList from '@/features/todos/ToDoList';
import TodoStats from '@/features/todos/TodoStats';

export default function TodosPage() {
  const { data: session } = useSession();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Tasks</h1>

      <div className="mb-6">
        <TodoStats />
      </div>

      <div className="bg-white dark:bg-gray-700 shadow-md rounded-lg p-6">
        <ToDoList />
      </div>
    </div>
  );
}
