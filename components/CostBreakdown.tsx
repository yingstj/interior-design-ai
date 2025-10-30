import React, { useState } from 'react';
import type { PlacedFurnitureItem } from '../types';

interface CostBreakdownProps {
  items: PlacedFurnitureItem[];
  onClose: () => void;
}

type SortBy = 'name' | 'price' | 'area';
type SortOrder = 'asc' | 'desc';

const CostBreakdown: React.FC<CostBreakdownProps> = ({ items, onClose }) => {
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterStyle, setFilterStyle] = useState<string>('all');

  // Get unique styles
  const styles = ['all', ...Array.from(new Set(items.map(item => item.style)))];

  // Filter items
  const filteredItems = filterStyle === 'all' 
    ? items 
    : items.filter(item => item.style === filterStyle);

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    let compareValue = 0;
    
    switch (sortBy) {
      case 'name':
        compareValue = a.name.localeCompare(b.name);
        break;
      case 'price':
        compareValue = a.price - b.price;
        break;
      case 'area':
        const areaA = (a.width * a.depth) / 144; // Convert to sq ft
        const areaB = (b.width * b.depth) / 144;
        compareValue = areaA - areaB;
        break;
    }
    
    return sortOrder === 'asc' ? compareValue : -compareValue;
  });

  // Calculate statistics
  const totalCost = items.reduce((sum, item) => sum + item.price, 0);
  const avgPrice = items.length > 0 ? totalCost / items.length : 0;
  const totalArea = items.reduce((sum, item) => sum + (item.width * item.depth) / 144, 0);
  const mostExpensive = items.reduce((max, item) => item.price > max.price ? item : max, items[0] || { price: 0 } as PlacedFurnitureItem);

  const handleSort = (newSortBy: SortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Cost Breakdown</h2>
            <p className="text-sm text-gray-600 mt-1">Detailed analysis of your design expenses</p>
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

        {/* Summary Statistics */}
        <div className="p-6 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm font-medium text-gray-600">Total Cost</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${totalCost.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm font-medium text-gray-600">Items</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{items.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm font-medium text-gray-600">Avg Price</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${avgPrice.toFixed(0)}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm font-medium text-gray-600">Total Area</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalArea.toFixed(1)} sq ft</p>
            </div>
          </div>
          
          {mostExpensive && mostExpensive.price > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-800">
                💰 Most Expensive: <span className="font-bold">{mostExpensive.name}</span> - ${mostExpensive.price.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Filters and Sort */}
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Style:</span>
            <select
              value={filterStyle}
              onChange={(e) => setFilterStyle(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              {styles.map(style => (
                <option key={style} value={style}>
                  {style === 'all' ? 'All Styles' : style}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Sort:</span>
            <button
              onClick={() => handleSort('name')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                sortBy === 'name' 
                  ? 'bg-teal-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('price')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                sortBy === 'price' 
                  ? 'bg-teal-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('area')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                sortBy === 'area' 
                  ? 'bg-teal-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Area {sortBy === 'area' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-grow overflow-y-auto p-6">
          {sortedItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-lg font-medium">No items to display</p>
              {filterStyle !== 'all' && (
                <p className="text-sm mt-2">Try changing the style filter</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {sortedItems.map((item, index) => {
                const area = ((item.width * item.depth) / 144).toFixed(1);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4 flex-grow">
                      <div className="flex items-center justify-center w-10 h-10 bg-teal-100 text-teal-700 rounded-full font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span>{(item.width / 12).toFixed(1)}' × {(item.depth / 12).toFixed(1)}'</span>
                          <span className="text-gray-400">•</span>
                          <span>{area} sq ft</span>
                          <span className="text-gray-400">•</span>
                          <span className="px-2 py-0.5 bg-gray-200 rounded text-xs">{item.style}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">${item.price.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">${(item.price / (item.width * item.depth / 144)).toFixed(2)}/sq ft</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Export */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {sortedItems.length} of {items.length} items
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                // Export to CSV
                const csvContent = [
                  ['Name', 'Width (ft)', 'Depth (ft)', 'Area (sq ft)', 'Price', 'Style'],
                  ...sortedItems.map(item => [
                    item.name,
                    (item.width / 12).toFixed(1),
                    (item.depth / 12).toFixed(1),
                    ((item.width * item.depth) / 144).toFixed(1),
                    item.price.toString(),
                    item.style
                  ])
                ].map(row => row.join(',')).join('\n');
                
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `cost-breakdown-${Date.now()}.csv`;
                link.click();
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-teal-700 rounded-lg hover:from-teal-700 hover:to-teal-800 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostBreakdown;

