import React from 'react';

interface UiCardProps {
  title?: string;
  tooltip?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Shared card component for Rich widgets following CMS design language
 * - Rounded corners (rounded-xl)
 * - Subtle borders
 * - Dark mode friendly
 * - Compact headings with muted labels
 */
export function UiCard({ title, tooltip, children, className = "" }: UiCardProps) {
  return (
    <div className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 ${className}`}>
      {title && (
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {title}
          </h3>
          {tooltip && (
            <div className="text-gray-400 dark:text-gray-500">
              {tooltip}
            </div>
          )}
        </div>
      )}
      <div className="text-gray-900 dark:text-gray-100">
        {children}
      </div>
    </div>
  );
}