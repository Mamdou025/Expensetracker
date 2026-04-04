import { Settings } from 'lucide-react';
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
  const { t } = useTranslation();

  const settingsTabs = isExpanded ? (
    <div className="flex gap-1">
      {['display', 'categories', 'tags', 'mappings', 'transactions'].map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === tab
              ? 'nav-active'
              : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
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
            timeGrouping={timeGrouping}
            setTimeGrouping={setTimeGrouping}
            showCategoryBreakdown={showCategoryBreakdown}
            setShowCategoryBreakdown={setShowCategoryBreakdown}
          />
        );
      case 'categories':
        return (
          <CategoryManager
            categories={categories}
            onRefreshCategories={onRefreshCategories}
            onCreateCategory={onCreateCategory}
            onDeleteCategory={onDeleteCategory}
          />
        );
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
      icon={Settings}
      isExpanded={isExpanded}
      onToggle={onToggle}
      headerContent={settingsTabs}
      className="mb-4"
    >
      {renderContent()}
    </ExpandableSection>
  );
};

export default SettingsSection;
