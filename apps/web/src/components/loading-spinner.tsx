import { Terra25Logo } from './terra25-logo';

interface LoadingSpinnerProps {
  size?: number;
  message?: string;
  className?: string;
}

export function LoadingSpinner({ 
  size = 60, 
  message = "Loading...", 
  className = "" 
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className="relative">
        <Terra25Logo 
          size={size} 
          className="animate-pulse" 
        />
        <div className="absolute inset-0 animate-spin">
          <div className="w-full h-full border-4 border-transparent border-t-blue-500 rounded-full"></div>
        </div>
      </div>
      {message && (
        <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}

export function FullPageLoading({ message = "Loading Terra25..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900 flex items-center justify-center">
      <LoadingSpinner size={80} message={message} />
    </div>
  );
}