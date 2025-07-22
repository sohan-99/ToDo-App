'use client';

import { toast } from 'sonner';

// Toast utility functions
export const showToast = {
  success: (message: string) => {
    toast.success(message);
  },
  error: (message: string) => {
    toast.error(message);
  },
  warning: (message: string) => {
    toast.warning(message);
  },
  info: (message: string, _error: unknown) => {
    toast.info(message);
  },
  loading: (message: string) => {
    return toast.loading(message);
  },
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    });
  },
};
