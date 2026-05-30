/**
 * EmptyState — Placeholder component shown when there's no data.
 */

import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📋',
  title = '暂无数据',
  description = '',
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      <span className="text-5xl mb-4">{icon}</span>
      <p className="text-base font-medium text-text mb-1">{title}</p>
      {description && (
        <p className="text-sm text-text-secondary text-center mb-4">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 px-6 py-2.5 bg-primary text-white text-sm rounded-xl active:bg-primary-light"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
