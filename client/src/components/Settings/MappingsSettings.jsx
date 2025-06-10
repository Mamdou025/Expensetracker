// src/components/settings/MappingsSettings.jsx
import React from 'react';

const MappingsSettings = () => {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-semibold text-lg mb-4">Tag-Category Mappings</h3>
        <p className="text-gray-600 mb-4">Associate tags with categories for automatic tagging</p>
        <div className="bg-gray-50 p-4 rounded-xl">
          <p className="text-sm text-gray-600">Feature coming soon - Auto-assign tags based on categories</p>
        </div>
      </div>
      
      <div>
        <h3 className="font-semibold text-lg mb-4">Keyword-Tag Mappings</h3>
        <p className="text-gray-600 mb-4">Auto-assign tags based on keywords in descriptions</p>
        <div className="bg-gray-50 p-4 rounded-xl">
          <p className="text-sm text-gray-600">Feature coming soon - Auto-assign tags based on keywords</p>
        </div>
      </div>
    </div>
  );
};

export default MappingsSettings;