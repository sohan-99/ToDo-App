"use client";

import { useState } from "react";
import {
  useGetTodosQuery,
  useAddTodoMutation,
  useDeleteTodoMutation,
  useUpdateTodoMutation,
} from "./api";
import { useTodoInputStore } from "./store";
import { ITodo } from "@/types/todo";

export default function ToDoList() {
  const { data, isLoading } = useGetTodosQuery();
  const input = useTodoInputStore((s) => s.input);
  const setInput = useTodoInputStore((s) => s.setInput);
  const reset = useTodoInputStore((s) => s.reset);

  const [addTodo] = useAddTodoMutation();
  const [deleteTodo] = useDeleteTodoMutation();
  const [updateTodo] = useUpdateTodoMutation();

  const [editMode, setEditMode] = useState<number | null>(null);
  const [editInput, setEditInput] = useState("");

  const handleAddTodo = async () => {
    if (!input.trim()) return;

    await addTodo({
      title: input,
      completed: false,
    });
    reset();
  };

  const handleToggleComplete = async (todo: ITodo) => {
    await updateTodo({
      ...todo,
      completed: !todo.completed,
    });
  };

  const handleDelete = async (id: number) => {
    await deleteTodo(id);
  };

  const startEdit = (todo: ITodo) => {
    setEditMode(todo.id);
    setEditInput(todo.title);
  };

  const cancelEdit = () => {
    setEditMode(null);
    setEditInput("");
  };

  const saveEdit = async (todo: ITodo) => {
    if (!editInput.trim()) return;

    await updateTodo({
      ...todo,
      title: editInput,
    });
    setEditMode(null);
    setEditInput("");
  };

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4 dark:text-white">Todo List</h1>

      <div className="flex mb-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-grow border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Add new todo here..."
          onKeyPress={(e) => e.key === "Enter" && handleAddTodo()}
        />
        <button
          onClick={handleAddTodo}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r"
        >
          Add
        </button>
      </div>

      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {data?.map((todo) => (
          <li key={todo.id} className="py-3">
            {editMode === todo.id ? (
              <div className="flex items-center">
                <input
                  type="text"
                  value={editInput}
                  onChange={(e) => setEditInput(e.target.value)}
                  className="flex-grow border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-1 mr-2"
                  autoFocus
                  onKeyPress={(e) => e.key === "Enter" && saveEdit(todo)}
                />
                <button
                  onClick={() => saveEdit(todo)}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded mr-1 text-sm"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggleComplete(todo)}
                    className="h-5 w-5 text-blue-500 mr-3"
                  />
                  <span
                    className={
                      todo.completed 
                        ? "line-through text-gray-400 dark:text-gray-500" 
                        : "dark:text-white"
                    }
                  >
                    {todo.title}
                  </span>
                </div>
                <div>
                  <button
                    onClick={() => startEdit(todo)}
                    className="text-blue-500 hover:text-blue-700 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(todo.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
