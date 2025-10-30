import React, { useState } from 'react';
import type { FloorPlanAnalysis } from '../types';

interface TestDataCollectorProps {
  analysis: FloorPlanAnalysis | undefined;
  imageName: string;
  analysisTime: number;
}

interface TestRecord {
  testId: string;
  timestamp: string;
  imageName: string;
  style: string;
  resolution: string;
  fileSize: string;
  analysisTime: number;
  wallsDetected: number;
  doorsDetected: number;
  doorsActual: number;
  windowsDetected: number;
  windowsActual: number;
  fixturesDetected: number;
  fixturesActual: number;
  roomsDetected: number;
  roomsActual: number;
  notes: string;
}

const TestDataCollector: React.FC<TestDataCollectorProps> = ({ analysis, imageName, analysisTime }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [testRecord, setTestRecord] = useState<TestRecord>({
    testId: `TEST-${Date.now()}`,
    timestamp: new Date().toISOString(),
    imageName: imageName,
    style: '',
    resolution: '',
    fileSize: '',
    analysisTime: analysisTime,
    wallsDetected: analysis?.walls?.length || 0,
    doorsDetected: analysis?.doors?.length || 0,
    doorsActual: 0,
    windowsDetected: analysis?.windows?.length || 0,
    windowsActual: 0,
    fixturesDetected: analysis?.fixtures?.length || 0,
    fixturesActual: 0,
    roomsDetected: analysis?.rooms?.length || 0,
    roomsActual: 0,
    notes: '',
  });

  const calculateAccuracy = (detected: number, actual: number) => {
    if (actual === 0) return 0;
    return Math.round((detected / actual) * 100);
  };

  const getQualityRating = () => {
    const doorAccuracy = calculateAccuracy(testRecord.doorsDetected, testRecord.doorsActual);
    const windowAccuracy = calculateAccuracy(testRecord.windowsDetected, testRecord.windowsActual);
    const fixtureAccuracy = calculateAccuracy(testRecord.fixturesDetected, testRecord.fixturesActual);
    
    const avgAccuracy = (doorAccuracy + windowAccuracy + fixtureAccuracy) / 3;
    
    if (avgAccuracy >= 90) return 'Excellent';
    if (avgAccuracy >= 70) return 'Good';
    if (avgAccuracy >= 50) return 'Fair';
    return 'Poor';
  };

  const exportToCSV = () => {
    const doorAccuracy = calculateAccuracy(testRecord.doorsDetected, testRecord.doorsActual);
    const windowAccuracy = calculateAccuracy(testRecord.windowsDetected, testRecord.windowsActual);
    const fixtureAccuracy = calculateAccuracy(testRecord.fixturesDetected, testRecord.fixturesActual);
    const quality = getQualityRating();

    const csvRow = [
      testRecord.testId,
      testRecord.imageName,
      testRecord.style,
      testRecord.resolution,
      testRecord.fileSize,
      testRecord.analysisTime,
      testRecord.wallsDetected,
      testRecord.doorsDetected,
      testRecord.doorsActual,
      testRecord.windowsDetected,
      testRecord.windowsActual,
      testRecord.fixturesDetected,
      testRecord.fixturesActual,
      testRecord.roomsDetected,
      testRecord.roomsActual,
      doorAccuracy,
      windowAccuracy,
      fixtureAccuracy,
      quality,
      `"${testRecord.notes.replace(/"/g, '""')}"`, // Escape quotes in notes
    ].join(',');

    const csvHeader = [
      'Test_ID',
      'Image_Name',
      'Style',
      'Resolution',
      'File_Size_MB',
      'Analysis_Time_s',
      'Walls_Detected',
      'Doors_Detected',
      'Doors_Actual',
      'Windows_Detected',
      'Windows_Actual',
      'Fixtures_Detected',
      'Fixtures_Actual',
      'Rooms_Detected',
      'Rooms_Actual',
      'Door_Accuracy_%',
      'Window_Accuracy_%',
      'Fixture_Accuracy_%',
      'Overall_Quality',
      'Notes',
    ].join(',');

    const csv = `${csvHeader}\n${csvRow}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(csv);
    
    // Also download as file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `floor-plan-test-${testRecord.testId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert('Test data copied to clipboard and downloaded as CSV!');
  };

  const exportToJSON = () => {
    const testData = {
      ...testRecord,
      accuracyMetrics: {
        doorAccuracy: calculateAccuracy(testRecord.doorsDetected, testRecord.doorsActual),
        windowAccuracy: calculateAccuracy(testRecord.windowsDetected, testRecord.windowsActual),
        fixtureAccuracy: calculateAccuracy(testRecord.fixturesDetected, testRecord.fixturesActual),
        overallQuality: getQualityRating(),
      },
      fullAnalysis: analysis,
    };

    const json = JSON.stringify(testData, null, 2);
    
    // Copy to clipboard
    navigator.clipboard.writeText(json);
    
    // Also download as file
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `floor-plan-test-${testRecord.testId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert('Test data copied to clipboard and downloaded as JSON!');
  };

  if (!analysis) return null;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg border-2 border-purple-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-purple-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <div className="text-left">
            <h3 className="text-lg font-bold text-gray-800">Test Data Collector</h3>
            <p className="text-xs text-gray-600">Record test results for analysis</p>
          </div>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="p-6 space-y-4 bg-white">
          <div className="grid grid-cols-2 gap-4">
            {/* Image Metadata */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Style</label>
              <select
                value={testRecord.style}
                onChange={(e) => setTestRecord({ ...testRecord, style: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select...</option>
                <option value="Modern">Modern</option>
                <option value="Traditional">Traditional</option>
                <option value="Victorian">Victorian/Historic</option>
                <option value="Apartment">Apartment/Condo</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Resolution</label>
              <input
                type="text"
                value={testRecord.resolution}
                onChange={(e) => setTestRecord({ ...testRecord, resolution: e.target.value })}
                placeholder="e.g., 1920x1080"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">File Size (MB)</label>
              <input
                type="text"
                value={testRecord.fileSize}
                onChange={(e) => setTestRecord({ ...testRecord, fileSize: e.target.value })}
                placeholder="e.g., 1.2"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Analysis Time (s)</label>
              <input
                type="number"
                value={testRecord.analysisTime}
                onChange={(e) => setTestRecord({ ...testRecord, analysisTime: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-gray-50"
                disabled
              />
            </div>
          </div>

          {/* Accuracy Inputs */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Actual Counts (Manual Count)</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Doors <span className="text-purple-600">(Detected: {testRecord.doorsDetected})</span>
                </label>
                <input
                  type="number"
                  value={testRecord.doorsActual || ''}
                  onChange={(e) => setTestRecord({ ...testRecord, doorsActual: Number(e.target.value) })}
                  placeholder="Actual"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Windows <span className="text-purple-600">(Detected: {testRecord.windowsDetected})</span>
                </label>
                <input
                  type="number"
                  value={testRecord.windowsActual || ''}
                  onChange={(e) => setTestRecord({ ...testRecord, windowsActual: Number(e.target.value) })}
                  placeholder="Actual"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Fixtures <span className="text-purple-600">(Detected: {testRecord.fixturesDetected})</span>
                </label>
                <input
                  type="number"
                  value={testRecord.fixturesActual || ''}
                  onChange={(e) => setTestRecord({ ...testRecord, fixturesActual: Number(e.target.value) })}
                  placeholder="Actual"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Accuracy Display */}
          {testRecord.doorsActual > 0 && (
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Accuracy Metrics</h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {calculateAccuracy(testRecord.doorsDetected, testRecord.doorsActual)}%
                  </div>
                  <div className="text-xs text-gray-600">Door Accuracy</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {calculateAccuracy(testRecord.windowsDetected, testRecord.windowsActual)}%
                  </div>
                  <div className="text-xs text-gray-600">Window Accuracy</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {calculateAccuracy(testRecord.fixturesDetected, testRecord.fixturesActual)}%
                  </div>
                  <div className="text-xs text-gray-600">Fixture Accuracy</div>
                </div>
              </div>
              <div className="mt-3 text-center">
                <span className="text-sm font-semibold text-gray-700">Overall Quality: </span>
                <span className={`text-sm font-bold ${
                  getQualityRating() === 'Excellent' ? 'text-green-600' :
                  getQualityRating() === 'Good' ? 'text-blue-600' :
                  getQualityRating() === 'Fair' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {getQualityRating()}
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
            <textarea
              value={testRecord.notes}
              onChange={(e) => setTestRecord({ ...testRecord, notes: e.target.value })}
              placeholder="Record any observations, issues, or edge cases..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Export Actions */}
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="flex-1 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
            <button
              onClick={exportToJSON}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              Export JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestDataCollector;

