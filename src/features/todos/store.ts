import { create } from 'zustand'

type ITodoInputStore = {
  input: string
  setInput: (value: string) => void
  reset: () => void
}

export const useTodoInputStore = create<ITodoInputStore>((set) => ({
  input: '',
  setInput: (value) => set({ input: value }),
  reset: () => set({ input: '' }),
}))
