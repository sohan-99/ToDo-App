import mongoose from 'mongoose';
import { IUser } from './user.interface';



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
      required: false, // Optional for OAuth users
    },
    image: {
      type: String,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'super-admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

// Check if model is already defined to avoid 'Cannot overwrite' error in development
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
