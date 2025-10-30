import React, { useState } from 'react';
import { roomTemplates, type RoomTemplate } from '../data/roomTemplates';

interface TemplateSelectorProps {
  onSelectTemplate: (template: RoomTemplate) => void;
  onClose: () => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelectTemplate, onClose }) => {
  const [selectedStyle, setSelectedStyle] = useState<string>('All');

  const styles = ['All', ...Array.from(new Set(roomTemplates.map(t => t.style)))];
  
  const filteredTemplates = selectedStyle === 'All' 
    ? roomTemplates 
    : roomTemplates.filter(t => t.style === selectedStyle);

  const handleSelectTemplate = (template: RoomTemplate) => {
    if (window.confirm(`Load "${template.name}" template? This will replace your current design.`)) {
      onSelectTemplate(template);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Room Templates</h2>
            <p className="text-sm text-gray-600 mt-1">Choose a pre-designed room to get started quickly</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Style Filter */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Filter by style:</span>
            {styles.map(style => (
              <button
                key={style}
                onClick={() => setSelectedStyle(style)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  selectedStyle === style
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-grow overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-teal-500 hover:shadow-lg transition-all bg-white"
              >
                {/* Template Preview */}
                <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center border border-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>

                {/* Template Info */}
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-600">{template.description}</p>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      <p>{template.roomWidth}' × {template.roomHeight}'</p>
                      <p>{template.furniture.length} items</p>
                    </div>
                    <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded">
                      {template.style}
                    </span>
                  </div>

                  {/* Total Cost */}
                  <div className="pt-2">
                    <p className="text-sm font-semibold text-green-600">
                      Total: ${template.furniture.reduce((sum, item) => sum + item.price, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium">No templates found for this style</p>
              <p className="text-sm mt-2">Try selecting a different style filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;

