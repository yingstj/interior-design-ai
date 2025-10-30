import React from 'react';
import type { CartItem } from '../types';

interface CartProps {
    items: CartItem[];
    onRemove: (itemId: string) => void;
    onShowBreakdown: () => void;
}

const Cart: React.FC<CartProps> = ({ items, onRemove, onShowBreakdown }) => {
    const totalCost = items.reduce((sum, item) => sum + item.price, 0);

    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-3">
                {items.length === 0 ? (
                    <div className="text-center text-gray-500 p-6 border-2 border-dashed border-gray-300 rounded-xl h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-teal-50">
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="font-medium">Your cart is empty.</p>
                            <p className="text-sm mt-1">Select furniture on the canvas to add items.</p>
                        </div>
                    </div>
                ) : (
                    items.map(item => (
                        <div key={item.id} className="flex flex-col p-3 border border-gray-200 rounded-xl bg-white hover:bg-gradient-to-br hover:from-white hover:to-teal-50 hover:border-teal-300 relative shadow-sm hover:shadow-md transition-all duration-200">
                            <div className="flex items-center mb-2">
                                <img src={item.imageUrl} alt={item.name} className="w-14 h-14 object-cover rounded-lg mr-3 shadow-sm" />
                                <div className="text-sm flex-grow pr-6">
                                    <p className="font-bold text-gray-800 mb-1 line-clamp-2">{item.name}</p>
                                    {item.retailer && (
                                        <p className="text-xs text-gray-500 mb-1">from {item.retailer}</p>
                                    )}
                                    <p className="text-teal-700 font-bold">${item.price.toLocaleString()}</p>
                                </div>
                                <button
                                    onClick={() => onRemove(item.id)}
                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all duration-200"
                                    aria-label={`Remove ${item.name}`}
                                >
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                   </svg>
                                </button>
                            </div>
                            {item.productUrl && (
                                <a
                                    href={item.productUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-emerald-600 rounded-lg hover:from-teal-700 hover:to-emerald-700 hover:shadow-lg transition-all duration-200"
                                >
                                    <span>Buy Now at {item.retailer || 'Store'}</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            )}
                        </div>
                    ))
                )}
            </div>
            <div className="flex-shrink-0 mt-4 pt-4 border-t-2 border-teal-100 space-y-3">
                <div className="flex justify-between items-center font-bold text-lg bg-gradient-to-r from-teal-50 to-emerald-50 p-4 rounded-xl border border-teal-200">
                    <span className="text-gray-700">Total:</span>
                    <span className="text-teal-700 text-xl">${totalCost.toLocaleString()}</span>
                </div>
                {items.length > 0 && (
                    <button
                        onClick={onShowBreakdown}
                        className="w-full px-4 py-2.5 text-sm font-semibold text-teal-700 bg-white border-2 border-teal-300 rounded-lg hover:bg-teal-50 transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        View Cost Breakdown
                    </button>
                )}
            </div>
        </div>
    );
};

export default Cart;
