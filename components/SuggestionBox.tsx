import React, { useState } from 'react';
import type { Suggestion, LoadingState, AutoSuggestion, Room, PlacedFurnitureItem } from '../types';
import LightbulbIcon from './icons/LightbulbIcon';

interface SuggestionBoxProps {
  suggestions: Suggestion[];
  onGetSuggestions: () => void;
  loadingState: LoadingState;
  onAutoDesign: () => void;
  room: Room;
  placedFurniture: PlacedFurnitureItem[];
  onDesignCommand: (prompt: string) => void;
  autoSuggestions: AutoSuggestion[];
  onApplyAutoSuggestion: (suggestion: AutoSuggestion) => void;
}

const SuggestionTypeIcon = ({ type }: { type: Suggestion['type'] }) => {
    switch (type) {
        case 'layout':
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>;
        case 'new_item':
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        case 'decor':
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L11 12.414l-4.293 4.293a1 1 0 01-1.414-1.414L9.586 11 5.293 6.707a1 1 0 011.414-1.414L11 9.586l4.293-4.293a1 1 0 011.414 0z" /></svg>;
    }
}

const SuggestionBox: React.FC<SuggestionBoxProps> = ({ suggestions, onGetSuggestions, loadingState, onAutoDesign, room, onDesignCommand, autoSuggestions, onApplyAutoSuggestion }) => {
  const [prompt, setPrompt] = useState('');
  const [showAutoSuggestions, setShowAutoSuggestions] = useState(true);
  
  const isPlanAnalyzed = !!room.analysis;

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onDesignCommand(prompt);
      setPrompt('');
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex flex-col h-full hover:shadow-xl transition-shadow duration-300">
      <h2 className="text-xl font-bold text-gray-800 border-b-2 border-teal-100 pb-3 mb-4 flex items-center gap-2">
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white text-sm font-bold">4</span>
        AI Assistance
      </h2>
      
      {/* Auto Suggestions Section */}
      {autoSuggestions.length > 0 && (
        <div className="mb-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl flex-shrink-0 shadow-sm">
          <button
            onClick={() => setShowAutoSuggestions(prev => !prev)}
            className="w-full flex justify-between items-center text-left font-bold text-amber-900"
          >
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-500 text-white font-mono text-sm">!</span>
              <span>Smart Suggestions ({autoSuggestions.length})</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-200 ${showAutoSuggestions ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showAutoSuggestions && (
            <div className="mt-3 space-y-2">
              {autoSuggestions.map((suggestion, index) => (
                <div key={index} className="p-3 bg-white rounded-lg border border-amber-200 text-sm shadow-sm">
                  <p className="text-gray-700 mb-2 leading-relaxed">{suggestion.description}</p>
                  <button
                    onClick={() => onApplyAutoSuggestion(suggestion)}
                    className="w-full text-center px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 text-xs font-bold shadow-sm hover:shadow-md"
                  >
                    Apply Fix
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Action Buttons */}
      <div className='space-y-3 mb-4 flex-shrink-0'>
        <button
          onClick={onAutoDesign}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-3.5 rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
          disabled={!isPlanAnalyzed || loadingState === 'suggesting' || loadingState === 'analyzing'}
          aria-label={!isPlanAnalyzed ? "Upload and analyze a floor plan first" : "Auto-design room"}
        >
          {loadingState === 'suggesting' ? 
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> : 
              <><span className="text-lg mr-2">✨</span> Auto-Design Room</>
          }
        </button>
        <button
          onClick={onGetSuggestions}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3.5 rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 flex items-center justify-center transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
          disabled={loadingState === 'suggesting'}
        >
          {loadingState === 'suggesting' ? 
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> : 
              <><LightbulbIcon className="mr-2 h-5 w-5" /> Get Manual Suggestions</>
          }
        </button>
      </div>

      <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-3 mb-4">
        {loadingState === 'suggesting' && (
          <div className="text-center text-gray-500 py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-teal-200 border-t-teal-600 mx-auto mb-2"></div>
            <p className="font-medium">Generating ideas...</p>
          </div>
        )}
        {suggestions.length === 0 && loadingState !== 'suggesting' && (
          <div className="text-center text-gray-500 p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gradient-to-br from-gray-50 to-teal-50">
            <LightbulbIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="font-medium">{!isPlanAnalyzed ? "Upload a floor plan to enable Auto-Design" : "Click a button or use the assistant below to get design ideas."}</p>
          </div>
        )}
        {suggestions.map((suggestion, index) => (
          <div key={index} className="bg-gradient-to-br from-white to-teal-50 p-4 rounded-xl border border-teal-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center mb-2">
                <SuggestionTypeIcon type={suggestion.type} />
                <h3 className="font-bold text-md text-gray-800 ml-2">{suggestion.title}</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{suggestion.description}</p>
          </div>
        ))}
      </div>

      <div className="flex-shrink-0 mt-auto pt-4 border-t-2 border-teal-100">
         <h3 className="text-lg font-bold text-gray-800 pb-3 flex items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
           </svg>
           AI Assistant
         </h3>
         <form onSubmit={handleCommandSubmit} className="space-y-3">
            <label htmlFor="ai-command" className="sr-only">AI Assistant Command</label>
            <textarea
                id="ai-command"
                rows={2}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-gray-900 transition-all duration-200"
                placeholder="e.g., Add a bookshelf on the right wall"
                disabled={loadingState === 'suggesting'}
            />
            <button
                type="submit"
                className="w-full bg-gradient-to-r from-gray-700 to-gray-800 text-white p-3 rounded-lg hover:from-gray-800 hover:to-gray-900 disabled:from-gray-400 disabled:to-gray-500 flex items-center justify-center transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
                disabled={loadingState === 'suggesting' || !prompt.trim()}
            >
             {loadingState === 'suggesting' ? 
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> :
                "Execute Command"
              }
            </button>
         </form>
      </div>
    </div>
  );
};

export default SuggestionBox;
