import React from 'react';

// Architectural element types that match the AI recognition system
export type ArchitecturalElementType = 
  | 'wall'
  | 'door-swing'
  | 'door-sliding'
  | 'door-pocket'
  | 'door-bifold'
  | 'window'
  | 'window-bay'
  | 'fixture-toilet'
  | 'fixture-sink'
  | 'fixture-tub'
  | 'fixture-shower'
  | 'fixture-stove'
  | 'fixture-refrigerator'
  | 'fixture-dishwasher'
  | 'fixture-washer'
  | 'fixture-dryer'
  | 'room-label'
  | 'dimension';

export interface ArchitecturalElement {
  type: ArchitecturalElementType;
  label: string;
  icon: string;
  category: 'structure' | 'openings' | 'fixtures' | 'annotations';
  description: string;
  defaultSize?: { width: number; height: number }; // in feet
}

const ARCHITECTURAL_ELEMENTS: ArchitecturalElement[] = [
  // Structure
  { type: 'wall', label: 'Wall', icon: '━', category: 'structure', description: 'Thick line, snaps to 90°' },
  
  // Openings
  { type: 'door-swing', label: 'Swing Door', icon: '⌒', category: 'openings', description: 'Arc shows swing path', defaultSize: { width: 3, height: 0.5 } },
  { type: 'door-sliding', label: 'Sliding Door', icon: '||', category: 'openings', description: 'Parallel lines', defaultSize: { width: 6, height: 0.5 } },
  { type: 'door-pocket', label: 'Pocket Door', icon: '⌐', category: 'openings', description: 'Slides into wall', defaultSize: { width: 3, height: 0.5 } },
  { type: 'door-bifold', label: 'Bifold Door', icon: '><', category: 'openings', description: 'Closet doors', defaultSize: { width: 4, height: 0.5 } },
  { type: 'window', label: 'Window', icon: '▭', category: 'openings', description: 'Break in wall + thin lines', defaultSize: { width: 3, height: 0.5 } },
  { type: 'window-bay', label: 'Bay Window', icon: '⊐', category: 'openings', description: 'Multiple panes', defaultSize: { width: 6, height: 0.5 } },
  
  // Kitchen Fixtures
  { type: 'fixture-refrigerator', label: 'Refrigerator', icon: '▢', category: 'fixtures', description: 'Labeled "Ref"', defaultSize: { width: 3, height: 2.5 } },
  { type: 'fixture-stove', label: 'Stove/Range', icon: '◉', category: 'fixtures', description: 'Circles for burners', defaultSize: { width: 2.5, height: 2.5 } },
  { type: 'fixture-dishwasher', label: 'Dishwasher', icon: '▣', category: 'fixtures', description: 'Labeled "DW"', defaultSize: { width: 2, height: 2 } },
  { type: 'fixture-sink', label: 'Sink', icon: '○', category: 'fixtures', description: 'Oval bowl shape', defaultSize: { width: 2, height: 1.5 } },
  
  // Bathroom Fixtures
  { type: 'fixture-toilet', label: 'Toilet', icon: '◐', category: 'fixtures', description: 'Circle + tank', defaultSize: { width: 2, height: 2.5 } },
  { type: 'fixture-tub', label: 'Bathtub', icon: '▬', category: 'fixtures', description: 'Rectangle 60"x30"', defaultSize: { width: 5, height: 2.5 } },
  { type: 'fixture-shower', label: 'Shower', icon: '⊠', category: 'fixtures', description: 'Square with X', defaultSize: { width: 3, height: 3 } },
  
  // Laundry
  { type: 'fixture-washer', label: 'Washer', icon: '⊙', category: 'fixtures', description: 'Labeled "W"', defaultSize: { width: 2.25, height: 2.25 } },
  { type: 'fixture-dryer', label: 'Dryer', icon: '⊚', category: 'fixtures', description: 'Labeled "D"', defaultSize: { width: 2.25, height: 2.25 } },
  
  // Annotations
  { type: 'room-label', label: 'Room Label', icon: 'Aa', category: 'annotations', description: 'Room name + dimensions' },
  { type: 'dimension', label: 'Dimension', icon: '↔', category: 'annotations', description: 'Measure distance' },
];

interface ArchitecturalPaletteProps {
  onElementSelect: (element: ArchitecturalElement) => void;
  selectedElement: ArchitecturalElement | null;
  isDrawingMode: boolean;
}

const ArchitecturalPalette: React.FC<ArchitecturalPaletteProps> = ({
  onElementSelect,
  selectedElement,
  isDrawingMode,
}) => {
  if (!isDrawingMode) return null;

  const categories = [
    { id: 'structure', label: 'Structure', color: 'gray' },
    { id: 'openings', label: 'Doors & Windows', color: 'blue' },
    { id: 'fixtures', label: 'Fixtures', color: 'green' },
    { id: 'annotations', label: 'Labels', color: 'purple' },
  ] as const;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
        <h3 className="text-white font-bold text-lg">Drawing Tools</h3>
      </div>

      <div className="p-4 space-y-6 max-h-[600px] overflow-y-auto">
        {categories.map((category) => {
          const elements = ARCHITECTURAL_ELEMENTS.filter(el => el.category === category.id);
          
          return (
            <div key={category.id}>
              <h4 className={`text-xs font-bold uppercase tracking-wider text-${category.color}-600 mb-3 flex items-center gap-2`}>
                <span className={`w-2 h-2 rounded-full bg-${category.color}-500`}></span>
                {category.label}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {elements.map((element) => {
                  const isSelected = selectedElement?.type === element.type;
                  return (
                    <button
                      key={element.type}
                      onClick={() => onElementSelect(element)}
                      className={`
                        p-3 rounded-lg border-2 transition-all duration-200 text-left
                        ${isSelected 
                          ? `border-${category.color}-500 bg-${category.color}-50 shadow-md scale-105` 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }
                      `}
                      title={element.description}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl font-bold text-gray-700">{element.icon}</span>
                        {isSelected && (
                          <svg className={`w-4 h-4 text-${category.color}-600`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-gray-800">{element.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{element.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="text-xs text-gray-600">
          <p className="font-semibold mb-1">💡 Tips:</p>
          <ul className="space-y-1 pl-4">
            <li>• Walls snap to 90° angles</li>
            <li>• Doors auto-generate swing arcs</li>
            <li>• Windows place in wall breaks</li>
            <li>• Live dimensions update automatically</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ArchitecturalPalette;
export { ARCHITECTURAL_ELEMENTS };

