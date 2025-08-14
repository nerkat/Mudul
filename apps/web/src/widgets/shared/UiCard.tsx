import React from 'react';

interface UiCardProps {
  title?: string;
  tooltip?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Preline UI Card component for Rich widgets
 * Uses actual Preline card structure and classes
 */
export function UiCard({ title, tooltip, children, className = "" }: UiCardProps) {
  return (
    <div className={`flex flex-col bg-white border shadow-sm rounded-xl dark:bg-neutral-900 dark:border-neutral-700 dark:shadow-neutral-700/70 ${className}`}>
      {title && (
        <div className="bg-gray-50 border-b rounded-t-xl py-3 px-4 md:py-4 md:px-5 dark:bg-neutral-900 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <p className="mt-1 text-sm text-gray-500 dark:text-neutral-500 uppercase tracking-wide font-medium">
              {title}
            </p>
            {tooltip && (
              <div className="text-gray-400 dark:text-gray-500">
                {tooltip}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="p-4 md:p-5">
        <div className="text-gray-800 dark:text-neutral-200">
          {children}
        </div>
      </div>
    </div>
  );
}