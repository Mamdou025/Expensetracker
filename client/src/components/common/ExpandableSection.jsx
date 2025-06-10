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
  headerContent = null // For custom header content (like settings tabs)
}) => {
  return (
    <div className={`bg-white rounded-3xl shadow-xl border ${className}`}>
      {/* Header */}
      <div className={`flex justify-between items-center p-6 ${headerClassName} ${
        headerContent ? 'border-b bg-gray-50' : ''
      }`}>
        <h3 className="font-semibold text-xl flex items-center gap-3">
          {Icon && <Icon className="w-6 h-6" />}
          {title}
        </h3>
        {showToggle && (
          <button
            onClick={onToggle}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {/* Custom Header Content (for settings tabs) */}
      {headerContent && (
        <div className="border-b bg-gray-50 p-6">
          {headerContent}
        </div>
      )}

      {/* Expandable Content */}
      {isExpanded && (
        <div className={`p-6 ${contentClassName}`}>
          {children}
        </div>
      )}
    </div>
  );
};

export default ExpandableSection;