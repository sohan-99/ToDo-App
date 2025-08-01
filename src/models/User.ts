import mongoose from 'mongoose';
import { IUser, AdminPermissions } from './user.interface';
const AdminPermissionsSchema = new mongoose.Schema<AdminPermissions>(
  {
    canUpdateUserInfo: {
      type: Boolean,
      default: true,
    },
    canDeleteUsers: {
      type: Boolean,
      default: false,
    },
    canPromoteToAdmin: {
      type: Boolean,
      default: false,
    },
    canDemoteAdmins: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);
const UserSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email address'],
      unique: true,
    },
    password: {
      type: String,
      required: false,
    },
    image: {
      type: String,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'super-admin'],
      default: 'user',
    },
    adminPermissions: {
      type: AdminPermissionsSchema,
      default: () => ({
        canUpdateUserInfo: true,
        canDeleteUsers: false,
        canPromoteToAdmin: false,
        canDemoteAdmins: false,
      }),
    },
  },
  {
    timestamps: true,
  }
);
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
