'use client';
export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'white';
}
export default function LoadingSpinner({
  size = 'medium',
  color = 'primary',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  };
  const colorClasses = {
    primary: 'border-indigo-500',
    secondary: 'border-gray-500',
    white: 'border-white',
  };
  return (
    <div className="flex justify-center items-center">
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} border-t-2 border-b-2 ${colorClasses[color]}`}
      />
    </div>
  );
}
