// src/components/Sections/SettingsSection.jsx
import { Sliders  } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import ExpandableSection from '../common/ExpandableSection';
import DisplaySettings from '../Settings/DisplaySettings';
import CategoryManager from '../Settings/CategoryManager';
import TagManager from '../Settings/TagManager';
import MappingsSettings from '../Settings/MappingsSettings';
import AddTransactionForm from '../Settings/AddTransactionForm';

const SettingsSection = ({ 
  isExpanded, 
  onToggle, 
  activeTab,
  setActiveTab,
  itemsPerPage,
  setItemsPerPage,
  chartType,
  setChartType,
  categories,
  tags,
  showAddTransaction,
  setShowAddTransaction,
  newTransaction,
  setNewTransaction,
  onAddTransaction,
  onCreateCategory,
  onDeleteCategory, 
  onRefreshCategories,
  onCreateTag,
  onDeleteTag,
  onRefreshTags,
   timeGrouping,
  setTimeGrouping,
  showCategoryBreakdown,
  setShowCategoryBreakdown
  
}) => {
    console.log('SettingsSection received:', { timeGrouping, showCategoryBreakdown });

  const { t } = useTranslation();

  const settingsTabs = isExpanded ? (
    <div className="flex gap-4">
      {['display', 'categories', 'tags', 'mappings', 'transactions'].map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
            activeTab === tab
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          {t(`settings.tabs.${tab}`)}
        </button>
      ))}
    </div>
  ) : null;

  const renderContent = () => {
    switch(activeTab) {
       case 'display':
  return (
    <DisplaySettings 
      itemsPerPage={itemsPerPage}
      setItemsPerPage={setItemsPerPage}
      chartType={chartType}
      setChartType={setChartType}
      // Add these new props:
      timeGrouping={timeGrouping}
      setTimeGrouping={setTimeGrouping}
      showCategoryBreakdown={showCategoryBreakdown}
      setShowCategoryBreakdown={setShowCategoryBreakdown}
    />
  );
      // Update the CategoryManager case in your renderContent function:
case 'categories':
  return (
    <CategoryManager 
      categories={categories}
      onRefreshCategories={onRefreshCategories}
      onCreateCategory={onCreateCategory}
      onDeleteCategory={onDeleteCategory}
    />
  );


// Update the TagManager case:
case 'tags':
  return (
    <TagManager 
      tags={tags}
      onRefreshTags={onRefreshTags}
      onCreateTag={onCreateTag}
      onDeleteTag={onDeleteTag}
    />
  );
      case 'mappings':
        return <MappingsSettings />;
      case 'transactions':
        return (
          <AddTransactionForm 
            showAddTransaction={showAddTransaction}
            setShowAddTransaction={setShowAddTransaction}
            newTransaction={newTransaction}
            setNewTransaction={setNewTransaction}
            categories={categories}
            tags={tags}
            onAddTransaction={onAddTransaction}
          />
        );
      default:
        return (
          <DisplaySettings 
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            chartType={chartType}
            setChartType={setChartType}
          />
        );
    }
  };

  return (
    <ExpandableSection
      title={t('settings.title')}
      icon={Sliders }
      isExpanded={isExpanded}
      onToggle={onToggle}
      headerContent={settingsTabs}
      className="mb-8"
    >
      {renderContent()}
    </ExpandableSection>
  );
};

export default SettingsSection;