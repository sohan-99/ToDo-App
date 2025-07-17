import ToDoList from "@/features/todos/ToDoList";
import ThemeToggle from "@/components/ThemeToggle";


export default function HomePage() {
  return (
    <main className="p-4 min-h-screen bg-white dark:bg-gray-900 dark:text-white transition-colors duration-200">
      <div className="flex justify-end mb-4">
        <ThemeToggle />
      </div>
      <ToDoList />
    </main>
  )
}
