import React, { useState, useRef, useEffect } from 'react';
import UploadIcon from './icons/UploadIcon';
import type { Room, LoadingState } from '../types';
import { 
  MIN_ROOM_DIMENSION, 
  MAX_ROOM_DIMENSION, 
  MIN_BUDGET, 
  MAX_BUDGET, 
  MIN_SCALE, 
  MAX_SCALE 
} from '../constants';

interface ControlPanelProps {
  room: Room;
  onRoomUpdate: (room: Partial<Room>) => void;
  onFloorPlanUpload: (file: File) => void;
  onFloorPlanClear: () => void;
  stylePreference: string;
  onStyleChange: (style: string) => void;
  budget: number | undefined;
  onBudgetChange: (budget: number | undefined) => void;
  loadingState: LoadingState;
  onShowTemplates?: () => void;
  analysisProgress?: number; // 0-100
  analysisMessage?: string;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  room,
  onRoomUpdate, 
  onFloorPlanUpload,
  onFloorPlanClear,
  stylePreference,
  onStyleChange,
  budget,
  onBudgetChange,
  loadingState,
  onShowTemplates,
  analysisProgress = 0,
  analysisMessage = 'Analyzing floor plan...',
}) => {
  const [width, setWidth] = useState(room.width);
  const [height, setHeight] = useState(room.height);
  const [fileName, setFileName] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setWidth(room.width);
    setHeight(room.height);
    // Don't sync fileName from props as it's local state based on file input
  }, [room.width, room.height]);

  // Timer for elapsed time during analysis
  useEffect(() => {
    if (loadingState === 'analyzing') {
      setElapsedTime(0);
      const interval = setInterval(() => {
        setElapsedTime(t => t + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedTime(0);
    }
  }, [loadingState]);

  const handleUpdate = () => {
    const validatedWidth = Math.max(MIN_ROOM_DIMENSION, Math.min(MAX_ROOM_DIMENSION, width));
    const validatedHeight = Math.max(MIN_ROOM_DIMENSION, Math.min(MAX_ROOM_DIMENSION, height));
    
    if (validatedWidth !== width || validatedHeight !== height) {
      setWidth(validatedWidth);
      setHeight(validatedHeight);
    }
    
    if (validatedWidth > 0 && validatedHeight > 0) {
      onRoomUpdate({ width: validatedWidth, height: validatedHeight });
    }
  };
  
  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
        onRoomUpdate({ scaleFtPerPx: undefined });
    } else {
        const newScale = parseFloat(value);
        if (!isNaN(newScale) && newScale >= MIN_SCALE && newScale <= MAX_SCALE) {
            onRoomUpdate({ scaleFtPerPx: newScale });
        }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onFloorPlanUpload(file);
      setFileName(file.name);
    }
  };

  const handleClearFile = () => {
    onFloorPlanClear();
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isDimensionsDisabled = !!room.analysis;

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 space-y-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between border-b-2 border-teal-100 pb-3">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 text-white text-sm font-bold">1</span>
          {(room.analysis || room.floorPlanImage) ? 'Floor Plan Analysis' : 'Room Setup'}
        </h2>
        {onShowTemplates && (
          <button
            onClick={onShowTemplates}
            className="px-3 py-1.5 text-sm font-semibold text-teal-700 bg-teal-50 border border-teal-300 rounded-lg hover:bg-teal-100 transition-colors flex items-center gap-1"
            title="Use a room template"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            Templates
          </button>
        )}
      </div>
      
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">
          {(room.analysis || room.floorPlanImage) ? 'Canvas Dimensions (feet)' : 'Room Dimensions (feet)'}
          {(room.analysis || room.floorPlanImage) && <span className="block text-xs font-normal text-gray-500 mt-1">Base canvas size (floor plan image will overlay)</span>}
        </label>
        <div className="flex items-center space-x-3">
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            onBlur={handleUpdate}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500 transition-all duration-200"
            placeholder="Width"
            disabled={isDimensionsDisabled}
            aria-disabled={isDimensionsDisabled}
          />
          <span className="text-gray-400 font-medium">×</span>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            onBlur={handleUpdate}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500 transition-all duration-200"
            placeholder="Height"
            disabled={isDimensionsDisabled}
            aria-disabled={isDimensionsDisabled}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          {room.analysis ? 'Floor Plan Image' : 'Upload Floor Plan (Optional)'}
          {!room.analysis && <span className="block text-xs font-normal text-gray-500 mt-1">Analyze entire apartment layouts with AI</span>}
        </label>
        <label htmlFor="file-upload" className="relative cursor-pointer bg-gradient-to-br from-gray-50 to-teal-50 rounded-xl font-medium text-teal-600 hover:text-teal-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500 border-2 border-dashed border-teal-300 hover:border-teal-400 p-6 flex justify-center items-center text-center transition-all duration-200">
          <div className="space-y-3 w-full">
            {loadingState === 'analyzing' ? (
              <>
                <div className="mx-auto h-12 w-12 text-teal-500 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-200 border-t-teal-600"></div>
                </div>
                <div className="space-y-2">
                  <span className="block font-semibold text-gray-800">{analysisMessage}</span>
                  <p className="text-xs text-gray-500">
                    Elapsed: {elapsedTime}s {elapsedTime > 30 && '(This can take up to 90 seconds)'}
                  </p>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-teal-500 to-teal-600 h-2 transition-all duration-500 ease-out"
                      style={{ width: `${analysisProgress}%` }}
                    ></div>
                  </div>
                  
                  <p className="text-xs text-gray-600 italic">
                    Detecting walls, doors, windows, and fixtures...
                  </p>
                </div>
              </>
            ) : room.floorPlanImage ? (
              <>
                <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="block font-semibold text-green-700">Floor plan uploaded</span>
                {fileName && <p className="text-xs text-gray-600 mt-1">{fileName}</p>}
                <p className="text-xs text-teal-600 mt-1">Click to replace</p>
              </>
            ) : (
              <>
                <UploadIcon className="mx-auto h-12 w-12 text-teal-500" />
                <span className="block font-semibold">{fileName || 'Click to upload'}</span>
                <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
              </>
            )}
          </div>
          <input ref={fileInputRef} id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg" disabled={loadingState === 'analyzing'} />
        </label>
        {(fileName || room.floorPlanImage) && (
          <button onClick={handleClearFile} className="text-sm font-medium text-red-600 hover:text-red-800 w-full mt-3 transition-colors flex items-center justify-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Remove Floor Plan
          </button>
        )}
      </div>
      
      {room.analysis && (
        <div className="space-y-3 border-t-2 border-teal-100 pt-4">
          <label htmlFor="scale" className="block text-sm font-semibold text-gray-700">Floor Plan Scale</label>
           <input
            type="number"
            id="scale"
            value={room.scaleFtPerPx || ''}
            onChange={handleScaleChange}
            step="0.01"
            min="0"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-gray-900 transition-all duration-200"
            placeholder="e.g., 0.1"
            aria-describedby="scale-description"
          />
          <p id="scale-description" className="text-xs text-gray-500 leading-relaxed">Enter feet per pixel. E.g., if a 10ft wall is 100px long, the scale is 0.1.</p>
        </div>
      )}


      <h2 className="text-xl font-bold text-gray-800 border-b-2 border-teal-100 pb-3 pt-4 flex items-center gap-2">
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-sm font-bold">2</span>
        Design Preferences
      </h2>
      <div className="space-y-3">
        <label htmlFor="style" className="block text-sm font-semibold text-gray-700">Style</label>
        <select
          id="style"
          value={stylePreference}
          onChange={(e) => onStyleChange(e.target.value)}
          className="mt-1 block w-full px-4 py-2.5 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 rounded-lg bg-white text-gray-900 transition-all duration-200"
        >
          <option>Modern</option>
          <option>Minimalist</option>
          <option>Scandinavian</option>
          <option>Industrial</option>
          <option>Bohemian</option>
        </select>
      </div>

       <div className="space-y-3">
        <label htmlFor="budget" className="block text-sm font-semibold text-gray-700">Budget for new items ($)</label>
        <input
            type="number"
            id="budget"
            value={budget ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              onBudgetChange(val === '' ? undefined : Number(val));
            }}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-gray-900 transition-all duration-200"
            placeholder="Leave blank for no limit"
          />
      </div>
    </div>
  );
};

export default ControlPanel;
