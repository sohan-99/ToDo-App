'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  useGetTodosQuery,
  useAddTodoMutation,
  useDeleteTodoMutation,
  useUpdateTodoMutation,
} from './api';
import { useTodoInputStore } from './store';
import { ITodo } from '@/types/todo';

export default function ToDoList() {
  const { status: authStatus } = useSession();
  const { data, isLoading } = useGetTodosQuery(undefined, {
    // Skip the query if user is not authenticated
    skip: authStatus !== 'authenticated',
  });
  const input = useTodoInputStore(s => s.input);
  const setInput = useTodoInputStore(s => s.setInput);
  const reset = useTodoInputStore(s => s.reset);

  const [addTodo] = useAddTodoMutation();
  const [deleteTodo] = useDeleteTodoMutation();
  const [updateTodo] = useUpdateTodoMutation();

  const [editMode, setEditMode] = useState<string | number | null>(null);
  const [editInput, setEditInput] = useState('');

  const handleAddTodo = async () => {
    if (!input.trim() || authStatus !== 'authenticated') return;

    await addTodo({
      title: input,
      completed: false,
    });
    reset();
  };

  const handleToggleComplete = async (todo: ITodo) => {
    if (authStatus !== 'authenticated') return;

    await updateTodo({
      ...todo,
      completed: !todo.completed,
    });
  };

  const handleDelete = async (id: string | number) => {
    if (authStatus !== 'authenticated') return;

    await deleteTodo(id);
  };

  const startEdit = (todo: ITodo) => {
    setEditMode(todo.id);
    setEditInput(todo.title);
  };

  const cancelEdit = () => {
    setEditMode(null);
    setEditInput('');
  };

  const saveEdit = async (todo: ITodo) => {
    if (!editInput.trim()) return;

    await updateTodo({
      ...todo,
      title: editInput,
    });
    setEditMode(null);
    setEditInput('');
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
        <h1 className="text-3xl font-bold text-white flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 mr-3"
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
          Task Manager
        </h1>
        <p className="text-indigo-100 mt-1">Organize your day efficiently</p>
      </div>

      <div className="p-6">
        <div className="flex mb-6">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-grow border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-l-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150"
            placeholder="What do you need to accomplish today?"
            onKeyPress={e => e.key === 'Enter' && handleAddTodo()}
          />
          <button
            onClick={handleAddTodo}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-r-lg transition duration-150 flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Add
          </button>
        </div>

        {data?.length === 0 ? (
          <div className="text-center py-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="mt-4 text-gray-500 dark:text-gray-400">
              No tasks yet. Add one to get started!
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {data?.map(todo => (
              <li
                key={todo.id}
                className="py-4 transition duration-150 hover:bg-gray-50 dark:hover:bg-gray-750 rounded-lg px-2"
              >
                {editMode === todo.id ? (
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={editInput}
                      onChange={e => setEditInput(e.target.value)}
                      className="flex-grow border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      autoFocus
                      onKeyPress={e => e.key === 'Enter' && saveEdit(todo)}
                    />
                    <button
                      onClick={() => saveEdit(todo)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg mr-2 text-sm transition duration-150 flex items-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg text-sm transition duration-150 flex items-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => handleToggleComplete(todo)}
                          className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 mr-3 appearance-none border border-gray-300 dark:border-gray-600 checked:bg-indigo-600 checked:border-transparent"
                        />
                        {todo.completed && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3 text-white absolute inset-0 m-auto"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <span
                        className={`${
                          todo.completed
                            ? 'line-through text-gray-400 dark:text-gray-500'
                            : 'text-gray-800 dark:text-gray-100'
                        } transition-all duration-200`}
                      >
                        {todo.title}
                      </span>
                    </div>
                    <div className="flex">
                      <button
                        onClick={() => startEdit(todo)}
                        className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100 dark:hover:bg-gray-700 p-2 rounded-full mr-1 transition duration-150"
                        aria-label="Edit task"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(todo.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-gray-700 p-2 rounded-full transition duration-150"
                        aria-label="Delete task"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
