import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'full' | 'block' | 'mini';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function Loading({
  variant = 'block',
  size = 'md',
  text,
  className,
  ...props
}: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  const spinner = (
    <div className="relative flex items-center justify-center">
      {/* Outer Pulse Ring */}
      <span className={cn(
        "absolute inline-flex rounded-full bg-indigo-500/10 opacity-75 animate-ping",
        size === 'sm' ? 'h-6 w-6' : size === 'md' ? 'h-12 w-12' : 'h-20 w-20'
      )} />
      {/* Inner Rotating Ring */}
      <div
        className={cn(
          "animate-spin rounded-full border-t-indigo-600 border-r-transparent border-b-indigo-650/20 border-l-transparent",
          sizeClasses[size]
        )}
      />
    </div>
  );

  if (variant === 'full') {
    return (
      <div
        className={cn(
          "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs",
          className
        )}
        {...props}
      >
        {spinner}
        {text && (
          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground animate-pulse">
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'mini') {
    return (
      <div className={cn("inline-flex items-center gap-2", className)} {...props}>
        <div className="animate-spin rounded-full border-2 border-t-current border-r-transparent border-b-current/25 border-l-transparent h-3.5 w-3.5" />
        {text && <span className="text-xs">{text}</span>}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8",
        className
      )}
      {...props}
    >
      {spinner}
      {text && (
        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}
