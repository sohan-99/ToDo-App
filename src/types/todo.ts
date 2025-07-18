export interface ITodo {
  id: string | number;
  title: string;
  completed: boolean;
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  image?: string;
}
