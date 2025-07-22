import mongoose from 'mongoose';
import { ITodo } from '@/types/todo';
export interface IMongoTodo extends Omit<ITodo, 'id'> {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
const TodoSchema = new mongoose.Schema<IMongoTodo>(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title for this todo.'],
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
export default mongoose.models.Todo || mongoose.model<IMongoTodo>('Todo', TodoSchema);
