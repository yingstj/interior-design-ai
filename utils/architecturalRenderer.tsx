import React from 'react';
import type { Fixture, Point } from '../types';

/**
 * Architectural rendering utilities for floor plan elements
 * Follows standard architectural drawing conventions
 */

// Render a toilet symbol (circle with tank)
export const renderToilet = (
  fixture: Fixture,
  sx: number,
  sy: number,
  scale: number,
  key: string
): JSX.Element => {
  const { position, rotation, dimensions } = fixture;
  const w = (dimensions?.width || 24) * sx * scale;
  const d = (dimensions?.depth || 30) * sy * scale;
  const x = position.x * sx * scale;
  const y = position.y * sy * scale;

  return (
    <g
      key={key}
      transform={`translate(${x}, ${y}) rotate(${rotation})`}
      style={{ transformOrigin: 'center' }}
    >
      {/* Bowl (circle) */}
      <ellipse cx={0} cy={0} rx={w * 0.4} ry={d * 0.3} fill="white" stroke="black" strokeWidth={1.5} />
      {/* Tank (rectangle) */}
      <rect x={-w * 0.25} y={-d * 0.45} width={w * 0.5} height={d * 0.2} fill="white" stroke="black" strokeWidth={1.5} />
    </g>
  );
};

// Render a sink symbol (oval in rectangle)
export const renderSink = (
  fixture: Fixture,
  sx: number,
  sy: number,
  scale: number,
  key: string
): JSX.Element => {
  const { position, rotation, dimensions } = fixture;
  const w = (dimensions?.width || 24) * sx * scale;
  const d = (dimensions?.depth || 18) * sy * scale;
  const x = position.x * sx * scale;
  const y = position.y * sy * scale;

  return (
    <g
      key={key}
      transform={`translate(${x}, ${y}) rotate(${rotation})`}
      style={{ transformOrigin: 'center' }}
    >
      {/* Counter */}
      <rect x={-w / 2} y={-d / 2} width={w} height={d} fill="white" stroke="black" strokeWidth={1.5} />
      {/* Sink bowl */}
      <ellipse cx={0} cy={0} rx={w * 0.3} ry={d * 0.35} fill="white" stroke="black" strokeWidth={1} />
    </g>
  );
};

// Render a bathtub symbol (rectangle with drain)
export const renderTub = (
  fixture: Fixture,
  sx: number,
  sy: number,
  scale: number,
  key: string
): JSX.Element => {
  const { position, rotation, dimensions } = fixture;
  const w = (dimensions?.width || 60) * sx * scale;
  const d = (dimensions?.depth || 30) * sy * scale;
  const x = position.x * sx * scale;
  const y = position.y * sy * scale;

  return (
    <g
      key={key}
      transform={`translate(${x}, ${y}) rotate(${rotation})`}
      style={{ transformOrigin: 'center' }}
    >
      {/* Tub outline */}
      <rect x={-w / 2} y={-d / 2} width={w} height={d} fill="white" stroke="black" strokeWidth={2} />
      {/* Drain circle */}
      <circle cx={w * 0.35} cy={0} r={3} fill="black" />
    </g>
  );
};

// Render a shower symbol (square with X)
export const renderShower = (
  fixture: Fixture,
  sx: number,
  sy: number,
  scale: number,
  key: string
): JSX.Element => {
  const { position, rotation, dimensions } = fixture;
  const w = (dimensions?.width || 36) * sx * scale;
  const d = (dimensions?.depth || 36) * sy * scale;
  const x = position.x * sx * scale;
  const y = position.y * sy * scale;

  return (
    <g
      key={key}
      transform={`translate(${x}, ${y}) rotate(${rotation})`}
      style={{ transformOrigin: 'center' }}
    >
      {/* Shower base */}
      <rect x={-w / 2} y={-d / 2} width={w} height={d} fill="white" stroke="black" strokeWidth={2} />
      {/* X pattern for shower */}
      <line x1={-w / 2} y1={-d / 2} x2={w / 2} y2={d / 2} stroke="black" strokeWidth={1} />
      <line x1={w / 2} y1={-d / 2} x2={-w / 2} y2={d / 2} stroke="black" strokeWidth={1} />
    </g>
  );
};

// Render a stove/range symbol (circles for burners)
export const renderStove = (
  fixture: Fixture,
  sx: number,
  sy: number,
  scale: number,
  key: string
): JSX.Element => {
  const { position, rotation, dimensions } = fixture;
  const w = (dimensions?.width || 30) * sx * scale;
  const d = (dimensions?.depth || 30) * sy * scale;
  const x = position.x * sx * scale;
  const y = position.y * sy * scale;

  const burnerRadius = Math.min(w, d) * 0.15;
  const offsetX = w * 0.25;
  const offsetY = d * 0.25;

  return (
    <g
      key={key}
      transform={`translate(${x}, ${y}) rotate(${rotation})`}
      style={{ transformOrigin: 'center' }}
    >
      {/* Stove base */}
      <rect x={-w / 2} y={-d / 2} width={w} height={d} fill="white" stroke="black" strokeWidth={1.5} />
      {/* 4 burners */}
      <circle cx={-offsetX} cy={-offsetY} r={burnerRadius} fill="white" stroke="black" strokeWidth={1} />
      <circle cx={offsetX} cy={-offsetY} r={burnerRadius} fill="white" stroke="black" strokeWidth={1} />
      <circle cx={-offsetX} cy={offsetY} r={burnerRadius} fill="white" stroke="black" strokeWidth={1} />
      <circle cx={offsetX} cy={offsetY} r={burnerRadius} fill="white" stroke="black" strokeWidth={1} />
    </g>
  );
};

// Render a refrigerator symbol (rectangle with label)
export const renderRefrigerator = (
  fixture: Fixture,
  sx: number,
  sy: number,
  scale: number,
  key: string
): JSX.Element => {
  const { position, rotation, dimensions, label } = fixture;
  const w = (dimensions?.width || 36) * sx * scale;
  const d = (dimensions?.depth || 30) * sy * scale;
  const x = position.x * sx * scale;
  const y = position.y * sy * scale;

  return (
    <g
      key={key}
      transform={`translate(${x}, ${y}) rotate(${rotation})`}
      style={{ transformOrigin: 'center' }}
    >
      {/* Refrigerator box */}
      <rect x={-w / 2} y={-d / 2} width={w} height={d} fill="white" stroke="black" strokeWidth={1.5} />
      {/* Vertical line for doors */}
      <line x1={0} y1={-d / 2} x2={0} y2={d / 2} stroke="black" strokeWidth={1} />
      {/* Label */}
      {label && (
        <text
          x={0}
          y={0}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.min(w, d) * 0.3}
          fontFamily="Arial, sans-serif"
          fill="black"
        >
          {label}
        </text>
      )}
    </g>
  );
};

// Render a dishwasher symbol (rectangle with label)
export const renderDishwasher = (
  fixture: Fixture,
  sx: number,
  sy: number,
  scale: number,
  key: string
): JSX.Element => {
  const { position, rotation, dimensions, label } = fixture;
  const w = (dimensions?.width || 24) * sx * scale;
  const d = (dimensions?.depth || 24) * sy * scale;
  const x = position.x * sx * scale;
  const y = position.y * sy * scale;

  return (
    <g
      key={key}
      transform={`translate(${x}, ${y}) rotate(${rotation})`}
      style={{ transformOrigin: 'center' }}
    >
      {/* Dishwasher box */}
      <rect x={-w / 2} y={-d / 2} width={w} height={d} fill="white" stroke="black" strokeWidth={1.5} />
      {/* Label */}
      {label && (
        <text
          x={0}
          y={0}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.min(w, d) * 0.35}
          fontFamily="Arial, sans-serif"
          fill="black"
        >
          {label}
        </text>
      )}
    </g>
  );
};

// Render washer or dryer symbol (square with label)
export const renderWasherDryer = (
  fixture: Fixture,
  sx: number,
  sy: number,
  scale: number,
  key: string
): JSX.Element => {
  const { position, rotation, dimensions, label } = fixture;
  const w = (dimensions?.width || 27) * sx * scale;
  const d = (dimensions?.depth || 27) * sy * scale;
  const x = position.x * sx * scale;
  const y = position.y * sy * scale;

  return (
    <g
      key={key}
      transform={`translate(${x}, ${y}) rotate(${rotation})`}
      style={{ transformOrigin: 'center' }}
    >
      {/* Machine box */}
      <rect x={-w / 2} y={-d / 2} width={w} height={d} fill="white" stroke="black" strokeWidth={1.5} />
      {/* Circle for drum/door */}
      <circle cx={0} cy={0} r={Math.min(w, d) * 0.3} fill="white" stroke="black" strokeWidth={1} />
      {/* Label */}
      {label && (
        <text
          x={0}
          y={d * 0.4}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.min(w, d) * 0.25}
          fontFamily="Arial, sans-serif"
          fill="black"
        >
          {label}
        </text>
      )}
    </g>
  );
};

// Main fixture renderer that dispatches to specific types
export const renderFixture = (
  fixture: Fixture,
  sx: number,
  sy: number,
  scale: number,
  index: number
): JSX.Element | null => {
  const key = `fixture-${fixture.type}-${index}`;

  switch (fixture.type) {
    case 'toilet':
      return renderToilet(fixture, sx, sy, scale, key);
    case 'sink':
      return renderSink(fixture, sx, sy, scale, key);
    case 'tub':
      return renderTub(fixture, sx, sy, scale, key);
    case 'shower':
      return renderShower(fixture, sx, sy, scale, key);
    case 'stove':
      return renderStove(fixture, sx, sy, scale, key);
    case 'refrigerator':
      return renderRefrigerator(fixture, sx, sy, scale, key);
    case 'dishwasher':
      return renderDishwasher(fixture, sx, sy, scale, key);
    case 'washer':
    case 'dryer':
      return renderWasherDryer(fixture, sx, sy, scale, key);
    default:
      return null;
  }
};

// Render north arrow
export const renderNorthArrow = (
  x: number,
  y: number,
  angle: number = 0,
  size: number = 40
): JSX.Element => {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${angle})`}>
      {/* Circle background */}
      <circle cx={0} cy={0} r={size / 2} fill="white" stroke="black" strokeWidth={1.5} />
      {/* Arrow pointing up (north) */}
      <path
        d={`M 0,${-size * 0.35} L ${size * 0.15},${size * 0.1} L 0,${-size * 0.1} L ${-size * 0.15},${size * 0.1} Z`}
        fill="black"
        stroke="black"
        strokeWidth={1}
      />
      {/* N label */}
      <text
        x={0}
        y={size * 0.35}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size * 0.3}
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
        fill="black"
      >
        N
      </text>
    </g>
  );
};

// Render scale bar
export const renderScaleBar = (
  x: number,
  y: number,
  scaleText: string,
  barLength: number = 100
): JSX.Element => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Scale bar line */}
      <line x1={0} y1={0} x2={barLength} y2={0} stroke="black" strokeWidth={2} />
      {/* End ticks */}
      <line x1={0} y1={-5} x2={0} y2={5} stroke="black" strokeWidth={2} />
      <line x1={barLength} y1={-5} x2={barLength} y2={5} stroke="black" strokeWidth={2} />
      {/* Scale text */}
      <text
        x={barLength / 2}
        y={-10}
        textAnchor="middle"
        fontSize={12}
        fontFamily="Arial, sans-serif"
        fill="black"
      >
        {scaleText}
      </text>
    </g>
  );
};

// Render entry arrow
export const renderEntryArrow = (
  point: Point,
  sx: number,
  sy: number,
  scale: number,
  size: number = 30
): JSX.Element => {
  const x = point.x * sx * scale;
  const y = point.y * sy * scale;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Entry text above arrow */}
      <text
        x={0}
        y={-size * 0.8}
        textAnchor="middle"
        fontSize={14}
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
        fill="red"
      >
        ENTRY
      </text>
      {/* Arrow pointing to door */}
      <path
        d={`M 0,${-size * 0.5} L ${size * 0.2},${size * 0.1} L 0,0 L ${-size * 0.2},${size * 0.1} Z`}
        fill="red"
        stroke="red"
        strokeWidth={1.5}
      />
    </g>
  );
};

// Render title block with project info
export const renderTitleBlock = (
  x: number,
  y: number,
  projectName: string,
  roomDimensions: string,
  totalSqFt: number,
  scale: string
): JSX.Element => {
  const boxWidth = 300;
  const boxHeight = 80;
  const lineHeight = 16;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Title block border */}
      <rect
        x={0}
        y={0}
        width={boxWidth}
        height={boxHeight}
        fill="white"
        stroke="black"
        strokeWidth={2}
      />
      {/* Horizontal dividers */}
      <line x1={0} y1={lineHeight * 1.5} x2={boxWidth} y2={lineHeight * 1.5} stroke="black" strokeWidth={1} />
      <line x1={0} y1={lineHeight * 3} x2={boxWidth} y2={lineHeight * 3} stroke="black" strokeWidth={1} />
      <line x1={0} y1={lineHeight * 4.5} x2={boxWidth} y2={lineHeight * 4.5} stroke="black" strokeWidth={1} />

      {/* Project name (bold, larger) */}
      <text
        x={10}
        y={lineHeight}
        fontSize={14}
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
        fill="black"
      >
        {projectName}
      </text>

      {/* Room dimensions */}
      <text x={10} y={lineHeight * 2.5} fontSize={12} fontFamily="Arial, sans-serif" fill="black">
        Dimensions: {roomDimensions}
      </text>

      {/* Total square footage */}
      <text x={10} y={lineHeight * 4} fontSize={12} fontFamily="Arial, sans-serif" fill="black">
        Total Area: {totalSqFt.toFixed(0)} sq ft
      </text>

      {/* Scale */}
      <text x={10} y={lineHeight * 5.5} fontSize={12} fontFamily="Arial, sans-serif" fill="black">
        Scale: {scale}
      </text>
    </g>
  );
};

// Render legend for abbreviations
export const renderLegend = (
  x: number,
  y: number,
  abbreviations: { abbr: string; meaning: string }[]
): JSX.Element => {
  const boxWidth = 180;
  const lineHeight = 18;
  const headerHeight = 22;
  const boxHeight = headerHeight + lineHeight * abbreviations.length + 10;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Legend border */}
      <rect
        x={0}
        y={0}
        width={boxWidth}
        height={boxHeight}
        fill="white"
        stroke="black"
        strokeWidth={2}
      />

      {/* Header */}
      <rect x={0} y={0} width={boxWidth} height={headerHeight} fill="#f0f0f0" stroke="black" strokeWidth={1} />
      <text
        x={boxWidth / 2}
        y={headerHeight / 2 + 5}
        textAnchor="middle"
        fontSize={12}
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
        fill="black"
      >
        LEGEND
      </text>

      {/* Abbreviation entries */}
      {abbreviations.map((item, i) => (
        <g key={`legend-${i}`}>
          <text
            x={10}
            y={headerHeight + 10 + lineHeight * i + lineHeight * 0.7}
            fontSize={11}
            fontFamily="Arial, sans-serif"
            fill="black"
          >
            <tspan fontWeight="bold">{item.abbr}</tspan> - {item.meaning}
          </text>
        </g>
      ))}
    </g>
  );
};

