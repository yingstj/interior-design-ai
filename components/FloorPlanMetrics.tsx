import React, { useState } from 'react';
import type { FloorPlanAnalysis } from '../types';

interface FloorPlanMetricsProps {
  analysis: FloorPlanAnalysis | undefined;
  onExportMetrics?: () => void;
}

const FloorPlanMetrics: React.FC<FloorPlanMetricsProps> = ({ analysis, onExportMetrics }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!analysis) {
    return null;
  }

  const metrics = {
    walls: analysis.walls?.length || 0,
    doors: analysis.doors?.length || 0,
    windows: analysis.windows?.length || 0,
    fixtures: analysis.fixtures?.length || 0,
    rooms: analysis.rooms?.length || 0,
  };

  // Expected ranges for typical residential floor plans
  const expectations = {
    doors: { min: 5, max: 20, ideal: '8-15 doors' },
    windows: { min: 3, max: 30, ideal: '5-15 windows' },
    fixtures: { min: 2, max: 15, ideal: '3+ fixtures' },
    walls: { min: 10, max: 200, ideal: '50-100 segments' },
    rooms: { min: 3, max: 15, ideal: '5-8 rooms' },
  };

  const getStatusColor = (value: number, min: number, max: number) => {
    if (value === 0) return 'text-red-600 bg-red-50';
    if (value < min) return 'text-yellow-600 bg-yellow-50';
    if (value > max) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const getStatusIcon = (value: number, min: number, max: number) => {
    if (value === 0) return '❌';
    if (value < min) return '⚠️';
    if (value > max) return '⚠️';
    return '✅';
  };

  const fixtureTypes = analysis.fixtures?.reduce((acc, f) => {
    acc[f.type] = (acc[f.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-bold text-gray-800">Detection Metrics</h3>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="p-6 space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(metrics).map(([key, value]) => {
              const exp = expectations[key as keyof typeof expectations];
              const statusColor = getStatusColor(value, exp.min, exp.max);
              const statusIcon = getStatusIcon(value, exp.min, exp.max);
              
              return (
                <div key={key} className={`rounded-lg p-3 ${statusColor}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wide opacity-75">
                      {key}
                    </span>
                    <span className="text-lg">{statusIcon}</span>
                  </div>
                  <div className="text-2xl font-bold">{value}</div>
                  <div className="text-xs opacity-75 mt-1">Expected: {exp.ideal}</div>
                </div>
              );
            })}
          </div>

          {/* Fixture Breakdown */}
          {fixtureTypes && Object.keys(fixtureTypes).length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Fixture Details
              </h4>
              <div className="space-y-2">
                {Object.entries(fixtureTypes).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-gray-700">{type}</span>
                    <span className="font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Room List */}
          {analysis.rooms && analysis.rooms.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Detected Rooms
              </h4>
              <div className="space-y-1">
                {analysis.rooms.map((room, idx) => (
                  <div key={room.id || idx} className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded">
                    {room.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quality Assessment */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Detection Quality</h4>
            <div className="space-y-2">
              <QualityIndicator
                label="Door Detection"
                value={metrics.doors}
                min={expectations.doors.min}
                max={expectations.doors.max}
              />
              <QualityIndicator
                label="Window Detection"
                value={metrics.windows}
                min={expectations.windows.min}
                max={expectations.windows.max}
              />
              <QualityIndicator
                label="Fixture Detection"
                value={metrics.fixtures}
                min={expectations.fixtures.min}
                max={expectations.fixtures.max}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="border-t pt-4 flex gap-2">
            <button
              onClick={() => {
                const metricsText = `Floor Plan Analysis Metrics
=====================================
Walls: ${metrics.walls}
Doors: ${metrics.doors}
Windows: ${metrics.windows}
Fixtures: ${metrics.fixtures}
Rooms: ${metrics.rooms}

Fixture Breakdown:
${Object.entries(fixtureTypes || {}).map(([type, count]) => `  ${type}: ${count}`).join('\n')}

Detected Rooms:
${analysis.rooms.map((r, i) => `  ${i + 1}. ${r.label}`).join('\n')}
`;
                navigator.clipboard.writeText(metricsText);
                alert('Metrics copied to clipboard!');
              }}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Metrics
            </button>
            <button
              onClick={() => {
                console.log('📊 Full Analysis Data:', JSON.stringify(analysis, null, 2));
                alert('Full analysis data logged to console (F12)');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              View JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface QualityIndicatorProps {
  label: string;
  value: number;
  min: number;
  max: number;
}

const QualityIndicator: React.FC<QualityIndicatorProps> = ({ label, value, min, max }) => {
  const getQualityLevel = () => {
    if (value === 0) return { level: 'None', color: 'bg-red-500', width: 0 };
    if (value < min) return { level: 'Low', color: 'bg-yellow-500', width: 33 };
    if (value > max) return { level: 'High', color: 'bg-orange-500', width: 100 };
    return { level: 'Good', color: 'bg-green-500', width: 66 };
  };

  const { level, color, width } = getQualityLevel();

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <span className="text-xs font-semibold text-gray-900">{level} ({value})</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${width}%` }}
        ></div>
      </div>
    </div>
  );
};

export default FloorPlanMetrics;

