import mongoose from "mongoose";

export type UserRole = 'user' | 'admin' | 'super-admin';

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  image?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}