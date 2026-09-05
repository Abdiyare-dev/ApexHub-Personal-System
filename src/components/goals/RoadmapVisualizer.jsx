"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import RoadmapBackground from './RoadmapBackground';

export default function RoadmapVisualizer({ milestones = [], goalColor = '#8b5cf6', goalTitle = 'Journey' }) {
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize(); // Init
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Safe default for empty states
  const safeMilestones = milestones.length > 0 ? milestones : [
    { id: '1', title: 'Start Journey', completed: false, locked: false }
  ];

  // Logic for states: completed, active, locked
  // A milestone is active if it is NOT completed, but the previous one IS completed (or it's the first).
  // A milestone is locked if previous ones are NOT completed.
  const enrichedMilestones = useMemo(() => {
    let firstIncompleteFound = false;
    return safeMilestones.map((m, idx) => {
      let state = 'locked';
      if (m.completed) {
        state = 'completed';
      } else if (!firstIncompleteFound) {
        state = 'active';
        firstIncompleteFound = true;
      }
      return { ...m, state, step: idx + 1 };
    });
  }, [safeMilestones]);

  const activeMilestoneIdx = enrichedMilestones.findIndex(m => m.state === 'active');
  const avatarIndex = activeMilestoneIdx === -1 ? enrichedMilestones.length - 1 : activeMilestoneIdx;

  // Geometry calculations
  const SPACING = 200;
  const AMPLITUDE = 100;
  const OFFSET = 150; // padding

  const getCoordinates = (index, mobile) => {
    const primary = OFFSET + index * SPACING;
    const secondary = OFFSET + Math.sin(index * Math.PI / 2) * AMPLITUDE;
    
    if (mobile) {
      return { x: secondary, y: primary }; // Vertical
    }
    return { x: primary, y: secondary }; // Horizontal
  };

  const generatePath = (startIdx, endIdx, mobile) => {
    if (startIdx >= endIdx) return '';
    const start = getCoordinates(startIdx, mobile);
    let d = `M ${start.x} ${start.y}`;
    
    for (let i = startIdx + 1; i <= endIdx; i++) {
      const prev = getCoordinates(i - 1, mobile);
      const curr = getCoordinates(i, mobile);
      
      let cp1x, cp1y, cp2x, cp2y;
      if (mobile) {
        cp1x = prev.x;
        cp1y = prev.y + (SPACING / 2);
        cp2x = curr.x;
        cp2y = curr.y - (SPACING / 2);
      } else {
        cp1x = prev.x + (SPACING / 2);
        cp1y = prev.y;
        cp2x = curr.x - (SPACING / 2);
        cp2y = curr.y;
      }
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }
    return d;
  };

  // 3 segments of path: Completed (solid), Active (dashed, animated), Locked (dashed, gray)
  const completedPath = generatePath(0, Math.max(0, activeMilestoneIdx === -1 ? enrichedMilestones.length - 1 : activeMilestoneIdx - 1), isMobile);
  const activePath = generatePath(Math.max(0, activeMilestoneIdx - 1), activeMilestoneIdx === -1 ? 0 : activeMilestoneIdx, isMobile);
  const lockedPath = generatePath(activeMilestoneIdx === -1 ? enrichedMilestones.length - 1 : activeMilestoneIdx, enrichedMilestones.length - 1, isMobile);

  const viewBoxWidth = isMobile ? 300 : Math.max(800, OFFSET * 2 + (enrichedMilestones.length - 1) * SPACING);
  const viewBoxHeight = isMobile ? Math.max(600, OFFSET * 2 + (enrichedMilestones.length - 1) * SPACING) : 300;

  return (
    <div className="roadmap-container" ref={containerRef}>
      <RoadmapBackground color={goalColor} />
      
      <div className="svg-wrapper">
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          width="100%"
          height="100%"
          style={{ minHeight: isMobile ? '600px' : '350px' }}
        >
          <style>
            {`
              .marching-ants {
                stroke-dasharray: 10 10;
                animation: march 1s linear infinite;
              }
              @keyframes march {
                from { stroke-dashoffset: 20; }
                to { stroke-dashoffset: 0; }
              }
              .pulse-node {
                animation: pulse 2s infinite;
                transform-origin: center;
              }
              @keyframes pulse {
                0% { transform: scale(1); filter: drop-shadow(0 0 4px ${goalColor}80); }
                50% { transform: scale(1.15); filter: drop-shadow(0 0 15px ${goalColor}FF); }
                100% { transform: scale(1); filter: drop-shadow(0 0 4px ${goalColor}80); }
              }
              .node-group {
                cursor: pointer;
                transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
              }
              .node-group:hover {
                transform: scale(1.08);
              }
            `}
          </style>

          {/* PATH SEGMENTS */}
          {completedPath && (
            <path
              d={completedPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="4"
              strokeLinecap="round"
            />
          )}
          {activePath && (
            <path
              d={activePath}
              fill="none"
              stroke={goalColor}
              strokeWidth="4"
              className="marching-ants"
              strokeLinecap="round"
            />
          )}
          {lockedPath && (
            <path
              d={lockedPath}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="3"
              strokeDasharray="6 6"
              strokeLinecap="round"
            />
          )}

          {/* NODES */}
          {enrichedMilestones.map((m, idx) => {
            const pos = getCoordinates(idx, isMobile);
            const isCompleted = m.state === 'completed';
            const isActive = m.state === 'active';
            
            // Layout offsets for labels
            const labelXOffset = isMobile ? (pos.x > 150 ? -20 : 20) : 0;
            const labelYOffset = isMobile ? 0 : (pos.y > 150 ? 40 : -40);
            const textAnchor = isMobile ? (pos.x > 150 ? 'end' : 'start') : 'middle';

            return (
              <g 
                key={m.id} 
                className="node-group" 
                style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                onClick={() => setHoveredNode(hoveredNode === m.id ? null : m.id)}
                onMouseEnter={() => setHoveredNode(m.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Background shadow/glow */}
                <circle cx={pos.x} cy={pos.y} r="22" fill={isCompleted ? '#d1fae5' : isActive ? `${goalColor}20` : '#f1f5f9'} />
                
                {/* Main Node Shape */}
                <circle 
                  cx={pos.x} cy={pos.y} r="16" 
                  fill={isCompleted ? '#10b981' : isActive ? goalColor : '#cbd5e1'}
                  className={isActive ? 'pulse-node' : ''}
                  style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                />

                {/* Icon inside Node */}
                {isCompleted && (
                  <path d={`M${pos.x - 5} ${pos.y} L${pos.x - 1} ${pos.y + 4} L${pos.x + 6} ${pos.y - 4}`} fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                )}
                {isActive && (
                  <circle cx={pos.x} cy={pos.y} r="6" fill="white" />
                )}
                {m.state === 'locked' && (
                  <path d={`M${pos.x - 4} ${pos.y - 1} V${pos.y - 3} C${pos.x - 4} ${pos.y - 5.2} ${pos.x + 4} ${pos.y - 5.2} ${pos.x + 4} ${pos.y - 3} V${pos.y - 1} M${pos.x - 5} ${pos.y - 1} H${pos.x + 5} V${pos.y + 5} H${pos.x - 5} Z`} fill="none" stroke="white" strokeWidth="1.5" />
                )}

                {/* Step Badge */}
                <circle cx={pos.x + 14} cy={pos.y - 14} r="8" fill="var(--surface)" stroke="var(--border-color)" strokeWidth="1" />
                <text x={pos.x + 14} y={pos.y - 11} fontSize="9" fontWeight="bold" fill="var(--text-secondary)" textAnchor="middle">{m.step}</text>

                {/* Title Label */}
                <text 
                  x={pos.x + labelXOffset} 
                  y={pos.y + labelYOffset + (isMobile ? 4 : 0)} 
                  fontSize="12" 
                  fontWeight="600" 
                  fill="var(--text-primary)" 
                  textAnchor={textAnchor}
                  style={{ pointerEvents: 'none' }}
                >
                  {m.text?.length > 25 ? m.text.substring(0, 25) + '...' : (m.text || `Milestone ${m.step}`)}
                </text>
              </g>
            );
          })}

          {/* PROGRESS AVATAR / INDICATOR */}
          {enrichedMilestones.length > 0 && (
            <g style={{ 
              transform: `translate(${getCoordinates(avatarIndex, isMobile).x}px, ${getCoordinates(avatarIndex, isMobile).y - 35}px)`,
              transition: 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
              <path d="M 0 0 L -8 -12 A 10 10 0 1 1 8 -12 Z" fill={goalColor} filter="drop-shadow(0 4px 6px rgba(0,0,0,0.15))" />
              <circle cx="0" cy="-16" r="4" fill="white" />
            </g>
          )}
        </svg>
      </div>

      {/* HTML POPOVER / TOOLTIP */}
      {hoveredNode && (
        <div className="roadmap-popover">
          {(() => {
            const m = enrichedMilestones.find(x => x.id === hoveredNode);
            return (
              <>
                <div className="popover-header">
                  <span className={`status-badge ${m.state}`}>
                    {m.state === 'completed' ? 'Completed' : m.state === 'active' ? 'Active' : 'Locked'}
                  </span>
                  <span className="step-count">Step {m.step}</span>
                </div>
                <h4 className="popover-title">{m.text || 'Untitled Milestone'}</h4>
                {m.linked_project_id && (
                  <p className="popover-desc">Linked to a project. Progress auto-syncs.</p>
                )}
                {m.state === 'locked' && (
                  <p className="popover-desc locked-text">Complete previous milestones to unlock this stage of the journey.</p>
                )}
                {m.state === 'active' && (
                  <p className="popover-desc active-text">You are currently working on this phase.</p>
                )}
              </>
            );
          })()}
        </div>
      )}

      <style jsx>{`
        .roadmap-container {
          position: relative;
          width: 100%;
          border-radius: 16px;
          background: var(--surface-low);
          border: 1px solid var(--border-color);
          overflow: hidden;
          margin: 20px 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
        }
        .svg-wrapper {
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: thin;
        }
        .svg-wrapper::-webkit-scrollbar {
          height: 6px;
        }
        .svg-wrapper::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 6px;
        }
        @media (max-width: 768px) {
          .svg-wrapper {
            overflow-y: auto;
            overflow-x: hidden;
          }
        }

        .roadmap-popover {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 260px;
          background: var(--surface);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          pointer-events: none;
          animation: pop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          z-index: 10;
        }
        @keyframes pop {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .popover-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .status-badge {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 4px;
        }
        .status-badge.completed { background: rgba(16,185,129,0.15); color: #10b981; }
        .status-badge.active { background: rgba(139,92,246,0.15); color: #8b5cf6; }
        .status-badge.locked { background: var(--surface-low); color: var(--text-muted); }
        .step-count {
          font-size: 0.7rem;
          color: var(--text-secondary);
          font-weight: 600;
        }
        .popover-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 6px 0;
          line-height: 1.3;
        }
        .popover-desc {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.4;
        }
        .locked-text { color: var(--text-muted); font-style: italic; }
        .active-text { color: ${goalColor}; font-weight: 600; }
      `}</style>
    </div>
  );
}
