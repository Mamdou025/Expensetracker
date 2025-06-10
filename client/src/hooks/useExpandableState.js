import { useState } from 'react';

export const useExpandableState = (initialState = {}) => {
  const [expandedSections, setExpandedSections] = useState({
    settings: false,
    filters: true,
    timeChart: true,
    categoryChart: true,
    ...initialState
  });

  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  const expandAll = () => {
    setExpandedSections(prev => 
      Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );
  };

  const collapseAll = () => {
    setExpandedSections(prev => 
      Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {})
    );
  };

  return {
    expandedSections,
    toggleSection,
    expandAll,
    collapseAll
  };
};