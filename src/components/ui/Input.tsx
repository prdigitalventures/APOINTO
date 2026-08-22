import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base dark:border-gray-700 dark:bg-[#0b0d12] dark:text-gray-100',
        'placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';
