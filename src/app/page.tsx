import ToDoList from "@/features/todos/ToDoList";
import TodoStats from "@/features/todos/TodoStats";
import Header from "@/components/Header";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export default async function HomePage() {
  // Get the session server-side for initial render
  const session = await auth();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-white transition-colors duration-200">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Manage Your Tasks
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-300 sm:mt-4">
            Stay organized and boost your productivity
          </p>
        </div>

        {session ? (
          <>
            <TodoStats />
            <ToDoList />
          </>
        ) : (
          <div className="text-center py-10">
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
                Sign in to manage your tasks
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Create an account or sign in to start tracking your tasks and
                boost your productivity.
              </p>
            </div>
          </div>
        )}

        <footer className="mt-16 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} TaskMaster. All rights reserved.
          </p>
        </footer>
      </div>
    </main>
  );
}
