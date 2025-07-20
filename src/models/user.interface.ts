import mongoose from 'mongoose';

export type UserRole = 'user' | 'admin' | 'super-admin';

/**
 * Admin-specific permissions for granular control
 */
export interface AdminPermissions {
  canUpdateUserInfo: boolean; // Can update user name and email
  canDeleteUsers: boolean; // Can delete regular users
}

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  image?: string;
  role: UserRole;
  adminPermissions?: AdminPermissions; // Only used if role is 'admin'
  createdAt: Date;
  updatedAt: Date;
}
