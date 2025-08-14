import mongoose from 'mongoose';

export type UserRole = 'user' | 'admin' | 'super-admin';

export interface AdminPermissions {
  canUpdateUserInfo: boolean;
  canDeleteUsers: boolean;
  canPromoteToAdmin: boolean;
  canDemoteAdmins: boolean;
}

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  image?: string;
  role: UserRole;
  adminPermissions?: AdminPermissions;
  createdAt: Date;
  updatedAt: Date;
}
