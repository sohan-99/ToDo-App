/* eslint-disable no-undef */
/* eslint-disable react/jsx-no-undef */
'use client';

import { ITodo } from '@/types/todo';
import { useState, KeyboardEvent } from 'react';
import TodoItem from '../../../TodoItem';

interface EditableTodoItemProps {
  todo: ITodo;
  onToggleComplete: () => void;
  onDelete: () => void;
  // eslint-disable-next-line no-unused-vars
  onUpdate: (todo: ITodo, newTitle: string) => void;
}
export default function EditableTodoItem({
  todo,
  onToggleComplete,
  onDelete,
  onUpdate,
}: EditableTodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editInput, setEditInput] = useState(todo.title);

  const handleEdit = () => {
    setIsEditing(true);
    setEditInput(todo.title);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditInput(todo.title);
  };

  const handleSave = () => {
    if (editInput.trim()) {
      onUpdate(todo, editInput);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          value={editInput}
          onChange={e => setEditInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200"
          autoFocus
        />
        <div className="flex space-x-2 ml-2">
          <button
            onClick={handleSave}
            className="p-1.5 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-all duration-200"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="p-1.5 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <TodoItem
      todo={todo}
      onToggleComplete={onToggleComplete}
      onDelete={onDelete}
      onEdit={handleEdit}
    />
  );
}
