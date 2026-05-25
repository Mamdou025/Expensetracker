import React from 'react';
import { Brand, I } from '../../ui/BrandIcon';

const ExpandableSection = ({
  title,
  icon: Icon,
  iconName,
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
    <div className={`bg-gray-900 rounded-lg border border-gray-800 ${className}`}>
      <div className={`flex justify-between items-center px-5 py-3 ${headerClassName} ${
        headerContent ? 'border-b border-gray-800' : ''
      }`}>
        <h3 className="font-medium text-sm text-gray-400 flex items-center gap-2 uppercase tracking-wide">
          {iconName
            ? <Brand name={iconName} size={16} className="text-gray-500" />
            : Icon && <Icon className="w-4 h-4 text-gray-500" />}
          {title}
        </h3>
        {showToggle && (
          <button
            onClick={onToggle}
            className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <Brand name={isExpanded ? I.up : I.down} size={16} />
          </button>
        )}
      </div>

      {headerContent && (
        <div className="border-b border-gray-800 px-5 py-3">
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
