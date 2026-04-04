import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ExpandableSection = ({
  title,
  icon: Icon,
  isExpanded,
  onToggle,
  children,
  className = '',
  headerClassName = '',
  contentClassName = '',
  defaultExpanded = true,
  showToggle = true,
  headerContent = null
}) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div className={`flex justify-between items-center px-5 py-3 ${headerClassName} ${
        headerContent ? 'border-b' : ''
      }`}>
        <h3 className="font-medium text-sm text-gray-700 flex items-center gap-2 uppercase tracking-wide">
          {Icon && <Icon className="w-4 h-4 text-gray-400" />}
          {title}
        </h3>
        {showToggle && (
          <button
            onClick={onToggle}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {headerContent && (
        <div className="border-b px-5 py-3">
          {headerContent}
        </div>
      )}

      {isExpanded && (
        <div className={`px-5 py-4 ${contentClassName}`}>
          {children}
        </div>
      )}
    </div>
  );
};

export default ExpandableSection;
