import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ITodo } from '@/types/todo';
export interface UserStats {
  total: number;
  active: number;
  completed: number;
  pending: number;
}
export interface AdminStats {
  totalUsers: number;
  totalTasks: number;
  systemStatus: string;
}
export interface DashboardStats {
  userStats: UserStats;
  adminStats: AdminStats | null;
}
export const todosApi = createApi({
  reducerPath: 'todosApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/',
    credentials: 'include',
  }),
  tagTypes: ['Todos'],
  endpoints: builder => ({
    getStats: builder.query<DashboardStats, void>({
      query: () => 'stats',
      providesTags: ['Todos'],
    }),
    getTodos: builder.query<ITodo[], void>({
      query: () => 'todos',
      providesTags: ['Todos'],
    }),
    addTodo: builder.mutation<ITodo, Partial<ITodo>>({
      query: todo => ({
        url: 'todos',
        method: 'POST',
        body: todo,
      }),
      invalidatesTags: ['Todos'],
    }),
    deleteTodo: builder.mutation<void, string | number>({
      query: id => ({
        url: `todos/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Todos'],
    }),
    updateTodo: builder.mutation<ITodo, ITodo>({
      query: todo => ({
        url: `todos/${todo.id}`,
        method: 'PUT',
        body: {
          title: todo.title,
          completed: todo.completed,
        },
      }),
      invalidatesTags: ['Todos'],
    }),
  }),
});
export const {
  useGetStatsQuery,
  useGetTodosQuery,
  useAddTodoMutation,
  useDeleteTodoMutation,
  useUpdateTodoMutation,
} = todosApi;
