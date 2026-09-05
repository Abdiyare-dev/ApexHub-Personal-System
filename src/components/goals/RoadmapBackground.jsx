import React from 'react';

export default function RoadmapBackground({ color = '#8b5cf6' }) {
  // A subtle topographical contour / dashed pattern background
  return (
    <svg
      className="roadmap-background"
      width="100%"
      height="100%"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.15, // Very subtle
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="dots"
          x="0"
          y="0"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <circle fill={color} cx="2" cy="2" r="1.5"></circle>
        </pattern>
        <pattern
          id="topo"
          x="0"
          y="0"
          width="200"
          height="200"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M -50 50 Q 50 -50 150 50 T 350 50"
            fill="none"
            stroke={color}
            strokeWidth="0.5"
            strokeDasharray="4 4"
          />
          <path
            d="M -50 100 Q 50 0 150 100 T 350 100"
            fill="none"
            stroke={color}
            strokeWidth="0.5"
            strokeDasharray="4 4"
          />
          <path
            d="M -50 150 Q 50 50 150 150 T 350 150"
            fill="none"
            stroke={color}
            strokeWidth="0.5"
            strokeDasharray="4 4"
          />
        </pattern>
      </defs>

      {/* Base dot grid */}
      <rect width="100%" height="100%" fill="url(#dots)" opacity="0.3" />
      
      {/* Curved topological lines to add organic journey feel */}
      <rect width="100%" height="100%" fill="url(#topo)" opacity="0.7" />
    </svg>
  );
}
