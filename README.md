Project Overview
This is a Todo application built with Next.js that uses both Redux Toolkit (RTK) Query for API calls and Zustand for local state management. The application allows users to create, read, update, and delete todo items.

Tech Stack
Next.js: React framework for building the frontend
Redux Toolkit (RTK) Query: For API data fetching, caching, and state management
Zustand: For local UI state management
JSON Server: Backend mock API running on port 4000
TailwindCSS: For styling
Code Structure & Workflow

1. Data Structure
   The application uses a simple Todo type defined in todo.ts:

export interface ITodo {  id: number  title: string  completed: boolean} 2. State Management
The project uses a hybrid state management approach:

RTK Query (Redux Toolkit)
In api.ts, RTK Query is used for API calls:

getTodos: Fetches all todos from the server
addTodo: Creates a new todo
deleteTodo: Removes a todo by ID
updateTodo: Updates an existing todo
The Redux store is configured in index.ts and includes the todos API reducer.

Zustand Store
In store.ts, a Zustand store manages the local UI state:

Tracks the input value for creating new todos
Provides methods to set and reset the input value 3. Components
The main component is ToDoList.tsx which:

Uses the RTK Query hooks to fetch and manipulate todos
Uses Zustand store for managing input state
Implements all CRUD operations:
Add new todos
Toggle todo completion status
Edit todo titles
Delete todos
Handles edit mode UI state with React's useState 4. Application Structure
page.tsx: The main page that renders the TodoList component
layout.tsx: The root layout that wraps the application with the Redux Provider
db.json: The mock database file used by JSON Server 5. Data Flow
The application starts by rendering the ToDoList component in page.tsx
The component fetches todos from the JSON Server using RTK Query's useGetTodosQuery
When a user adds, edits, or deletes a todo:
The corresponding RTK Query mutation hook is called
The mutation updates the server data via JSON Server
RTK Query automatically refetches the data and updates the UI 6. Development Workflow
To run the application:

Start the JSON Server: npm run json-server (runs on port 4000)
Start the Next.js dev server: npm run dev (with Turbopack)
Key Features
API Data Management: Uses RTK Query for efficient API calls with automatic caching
Local UI State: Uses Zustand for simple local state management
CRUD Operations: Full create, read, update, delete functionality
Responsive UI: Clean UI with TailwindCSS styling
Edit Mode: Inline editing of todo items
Authentication: NextAuth.js with Google OAuth and credential sign-in options

## Setting Up Google OAuth

To set up Google authentication:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" and select "OAuth client ID"
5. Set the application type to "Web application"
6. Add your authorized origins (e.g., `http://localhost:3000`)
7. Add your authorized redirect URIs (e.g., `http://localhost:3000/api/auth/callback/google`)
8. Click "Create" and note your Client ID and Client Secret
9. Copy `.env.local.example` to `.env.local` and add your Google credentials:

```
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXTAUTH_SECRET=generate_a_secure_random_string
NEXTAUTH_URL=http://localhost:3000
```

For production, make sure to update the authorized origins and redirect URIs to your production domain.
