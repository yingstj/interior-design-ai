import React, { useState } from 'react';
import type { FurnitureItem, LoadingState, CartItem } from '../types';
import SearchIcon from './icons/SearchIcon';
import Cart from './Cart';

interface FurnitureSidebarProps {
  onSearch: (query: string) => void;
  searchedFurniture: FurnitureItem[];
  loadingState: LoadingState;
  cart: CartItem[];
  onRemoveFromCart: (itemId: string) => void;
  onShowBreakdown: () => void;
}

const FurnitureSidebar: React.FC<FurnitureSidebarProps> = ({ onSearch, searchedFurniture, loadingState, cart, onRemoveFromCart, onShowBreakdown }) => {
  const [query, setQuery] = useState('sofa');
  const [activeTab, setActiveTab] = useState<'search' | 'cart'>('search');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query) {
      onSearch(query);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: FurnitureItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
  };
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex flex-col h-full hover:shadow-xl transition-shadow duration-300">
      <div className="flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800 border-b-2 border-teal-100 pb-3 mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 text-white text-sm font-bold">3</span>
            Furniture & Cart
          </h2>
          <div className="flex border-b-2 border-gray-100 mb-4">
              <button
                  onClick={() => setActiveTab('search')}
                  className={`flex-1 py-3 text-center font-semibold transition-all duration-200 rounded-t-lg ${activeTab === 'search' ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                  Find Furniture
              </button>
              <button
                  onClick={() => setActiveTab('cart')}
                  className={`flex-1 py-3 text-center font-semibold transition-all duration-200 rounded-t-lg relative ${activeTab === 'cart' ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                  Shopping Cart
                  {cart.length > 0 && (
                      <span className="absolute top-2 right-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-md">{cart.length}</span>
                  )}
              </button>
          </div>
      </div>
      
      <div className="flex-grow overflow-hidden">
        {activeTab === 'search' && (
            <div className="flex flex-col h-full">
                <form onSubmit={handleSearch} className="flex mb-4 flex-shrink-0">
                    <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-grow px-4 py-2.5 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-gray-900 transition-all duration-200"
                    placeholder="e.g., coffee table"
                    />
                    <button type="submit" className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 rounded-r-lg hover:from-teal-700 hover:to-teal-800 disabled:from-teal-300 disabled:to-teal-400 flex items-center justify-center min-w-[48px] shadow-sm hover:shadow-md transition-all duration-200" disabled={loadingState === 'searching'}>
                    {loadingState === 'searching' ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> : <SearchIcon className="h-5 w-5" />}
                    </button>
                </form>

                <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-3">
                    {loadingState === 'searching' && (
                    <div className="text-center text-gray-500 py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-teal-200 border-t-teal-600 mx-auto mb-2"></div>
                      Searching for furniture...
                    </div>
                    )}
                    {searchedFurniture.length === 0 && loadingState !== 'searching' && (
                    <div className="text-center text-gray-500 p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                        <SearchIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                        <p className="font-medium">Search for furniture to add to your design.</p>
                    </div>
                    )}
                    {searchedFurniture.map((item) => (
                    <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item)}
                        className="flex flex-col p-3 border border-gray-200 rounded-xl cursor-grab active:cursor-grabbing bg-white hover:bg-gradient-to-br hover:from-gray-50 hover:to-teal-50 hover:shadow-md hover:border-teal-300 transition-all duration-200"
                    >
                        <div className="flex items-center mb-2">
                            <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-lg mr-3 shadow-sm" />
                            <div className="text-sm flex-grow">
                                <p className="font-bold text-gray-800 mb-1 line-clamp-2">{item.name}</p>
                                {item.retailer && (
                                    <p className="text-xs text-gray-500 mb-1">from {item.retailer}</p>
                                )}
                                <p className="text-gray-600 text-xs mb-1">{item.width}" × {item.depth}"</p>
                                <p className="text-teal-700 font-bold">${item.price}</p>
                            </div>
                        </div>
                        {item.productUrl && (
                            <a
                                href={item.productUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-emerald-600 rounded-lg hover:from-teal-700 hover:to-emerald-700 hover:shadow-lg transition-all duration-200 mt-2"
                            >
                                <span>Buy at {item.retailer || 'Store'}</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        )}
                    </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'cart' && <Cart items={cart} onRemove={onRemoveFromCart} onShowBreakdown={onShowBreakdown} />}
      </div>
    </div>
  );
};

export default FurnitureSidebar;
