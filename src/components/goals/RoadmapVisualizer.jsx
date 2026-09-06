"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import RoadmapBackground from './RoadmapBackground';

export default function RoadmapVisualizer({ milestones = [], goalColor = '#8b5cf6', goalTitle = 'Journey' }) {
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1.2); // Default zoomed-in for prominent, crisp view
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
  const enrichedMilestones = useMemo(() => {
    let firstIncompleteFound = false;
    return safeMilestones.map((m, idx) => {
      let state = 'locked';
      const isDone = m.completed === true || m.state === 'completed';
      if (isDone) {
        state = 'completed';
      } else if (!firstIncompleteFound) {
        state = 'active';
        firstIncompleteFound = true;
      }
      return { 
        ...m, 
        state, 
        step: idx + 1,
        text: m.text || m.title || m.name || `Milestone ${idx + 1}`
      };
    });
  }, [safeMilestones]);

  const activeMilestoneIdx = enrichedMilestones.findIndex(m => m.state === 'active');
  const avatarIndex = activeMilestoneIdx === -1 ? enrichedMilestones.length - 1 : activeMilestoneIdx;
  const activeMilestone = enrichedMilestones[avatarIndex];

  // Tight, zoomed-in geometry calculations
  // Geometry calculations
  const SPACING = isMobile ? 130 : 180;
  const AMPLITUDE = isMobile ? 40 : 40;
  const OFFSET = isMobile ? 60 : 90;

  const getCoordinates = (index, mobile) => {
    const primary = OFFSET + index * SPACING;
    const secondary = (mobile ? 140 : 125) + Math.sin(index * Math.PI / 2) * AMPLITUDE;
    
    if (mobile) {
      return { x: secondary, y: primary }; // Vertical winding
    }
    return { x: primary, y: secondary }; // Horizontal winding
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

  // 3 segments of path: Completed (solid emerald), Active (animated glow), Locked (subtle dashed)
  const completedPath = generatePath(0, Math.max(0, activeMilestoneIdx === -1 ? enrichedMilestones.length - 1 : activeMilestoneIdx - 1), isMobile);
  const activePath = generatePath(Math.max(0, activeMilestoneIdx - 1), activeMilestoneIdx === -1 ? 0 : activeMilestoneIdx, isMobile);
  const lockedPath = generatePath(activeMilestoneIdx === -1 ? enrichedMilestones.length - 1 : activeMilestoneIdx, enrichedMilestones.length - 1, isMobile);

  const totalLength = OFFSET * 2 + (enrichedMilestones.length - 1) * SPACING;
  const viewBoxWidth = isMobile ? 280 : Math.max(460, totalLength);
  const viewBoxHeight = isMobile ? Math.max(380, totalLength) : 260;

  const handleZoomIn = () => setZoomLevel(prev => Math.min(2.0, +(prev + 0.15).toFixed(2)));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(0.8, +(prev - 0.15).toFixed(2)));
  const handleZoomReset = () => setZoomLevel(1.2);

  return (
    <div className="roadmap-container" ref={containerRef}>
      <RoadmapBackground color={goalColor} />

      {/* Top Controls Bar */}
      <div className="roadmap-topbar">
        <div className="roadmap-stage-info">
          <span className="stage-pill" style={{ background: `${goalColor}20`, color: goalColor }}>
            Stage {avatarIndex + 1} of {enrichedMilestones.length}
          </span>
          <span className="stage-target">
            {activeMilestone ? activeMilestone.text : 'Completed'}
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="zoom-controls">
          <button className="zoom-btn" onClick={handleZoomOut} title="Zoom Out">−</button>
          <span className="zoom-indicator" onClick={handleZoomReset} title="Reset Zoom">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button className="zoom-btn" onClick={handleZoomIn} title="Zoom In">+</button>
        </div>
      </div>
      
      <div className="svg-wrapper">
        <div 
          className="svg-zoom-layer" 
          style={{ 
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top left',
            width: isMobile ? '100%' : `${viewBoxWidth}px`,
            minHeight: isMobile ? `${viewBoxHeight}px` : '240px'
          }}
        >
          <svg
            viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
            width={isMobile ? "100%" : `${viewBoxWidth}px`}
            height={isMobile ? `${viewBoxHeight}px` : "240px"}
          >
            <defs>
              {/* Gradients */}
              <linearGradient id={`grad-active-${goalColor.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={goalColor} />
                <stop offset="100%" stopColor="#00e5ff" />
              </linearGradient>
              <linearGradient id="grad-completed" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>

              {/* Glow Filter */}
              <filter id="node-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <style>
              {`
                .marching-ants {
                  stroke-dasharray: 8 6;
                  animation: march 1s linear infinite;
                }
                @keyframes march {
                  from { stroke-dashoffset: 28; }
                  to { stroke-dashoffset: 0; }
                }
                .pulse-node {
                  animation: pulse 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse {
                  0% { transform: scale(1); filter: drop-shadow(0 0 4px ${goalColor}80); }
                  50% { transform: scale(1.16); filter: drop-shadow(0 0 16px ${goalColor}); }
                  100% { transform: scale(1); filter: drop-shadow(0 0 4px ${goalColor}80); }
                }
                .node-group {
                  cursor: pointer;
                  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .node-group:hover {
                  transform: scale(1.12);
                }
                .pulse-ring {
                  animation: ring-expand 2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
                }
                @keyframes ring-expand {
                  0% { r: 18; opacity: 0.8; }
                  100% { r: 36; opacity: 0; }
                }
              `}
            </style>

            {/* PATH SEGMENTS */}
            {completedPath && (
              <path
                d={completedPath}
                fill="none"
                stroke="url(#grad-completed)"
                strokeWidth="5"
                strokeLinecap="round"
                filter="drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3))"
              />
            )}
            {activePath && (
              <path
                d={activePath}
                fill="none"
                stroke={`url(#grad-active-${goalColor.replace('#', '')})`}
                strokeWidth="5"
                className="marching-ants"
                strokeLinecap="round"
                filter="drop-shadow(0 2px 8px rgba(139, 92, 246, 0.4))"
              />
            )}
            {lockedPath && (
              <path
                d={lockedPath}
                fill="none"
                stroke="var(--border-color, rgba(148, 163, 184, 0.35))"
                strokeWidth="3.5"
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
              const labelXOffset = isMobile ? (pos.x > 140 ? -26 : 26) : 0;
              const labelYOffset = isMobile ? 0 : (pos.y > 110 ? 42 : -42);
              const textAnchor = isMobile ? (pos.x > 140 ? 'end' : 'start') : 'middle';

              const nodeKey = m.id || `node-${idx}`;
              return (
                <g 
                  key={nodeKey} 
                  className="node-group" 
                  style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                  onClick={() => setHoveredNode(hoveredNode === nodeKey ? null : nodeKey)}
                  onMouseEnter={() => setHoveredNode(nodeKey)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Outer Pulsing Aura on Active Node */}
                  {isActive && (
                    <circle 
                      cx={pos.x} 
                      cy={pos.y} 
                      className="pulse-ring" 
                      fill="none" 
                      stroke={goalColor} 
                      strokeWidth="2" 
                    />
                  )}

                  {/* Background shadow/glow */}
                  <circle 
                    cx={pos.x} 
                    cy={pos.y} 
                    r="24" 
                    fill={isCompleted ? 'rgba(16, 185, 129, 0.22)' : isActive ? `${goalColor}30` : 'rgba(148, 163, 184, 0.12)'} 
                  />
                  
                  {/* Main Node Shape */}
                  <circle 
                    cx={pos.x} 
                    cy={pos.y} 
                    r="18" 
                    fill={isCompleted ? 'url(#grad-completed)' : isActive ? goalColor : 'var(--surface-high, #64748b)'}
                    className={isActive ? 'pulse-node' : ''}
                    style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                    filter="drop-shadow(0 3px 6px rgba(0,0,0,0.2))"
                  />

                  {/* Icon inside Node */}
                  {isCompleted && (
                    <path 
                      d={`M${pos.x - 6} ${pos.y} L${pos.x - 1} ${pos.y + 5} L${pos.x + 7} ${pos.y - 4}`} 
                      fill="none" 
                      stroke="white" 
                      strokeWidth="3" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                  )}
                  {isActive && (
                    <circle cx={pos.x} cy={pos.y} r="6.5" fill="white" />
                  )}
                  {m.state === 'locked' && (
                    <path 
                      d={`M${pos.x - 4.5} ${pos.y - 1} V${pos.y - 3.5} C${pos.x - 4.5} ${pos.y - 6} ${pos.x + 4.5} ${pos.y - 6} ${pos.x + 4.5} ${pos.y - 3.5} V${pos.y - 1} M${pos.x - 5.5} ${pos.y - 1} H${pos.x + 5.5} V${pos.y + 5.5} H${pos.x - 5.5} Z`} 
                      fill="none" 
                      stroke="white" 
                      strokeWidth="1.6" 
                    />
                  )}

                  {/* Step Badge Pill */}
                  <circle 
                    cx={pos.x + 16} 
                    cy={pos.y - 16} 
                    r="9" 
                    fill="var(--surface)" 
                    stroke="var(--border-color)" 
                    strokeWidth="1.5" 
                  />
                  <text 
                    x={pos.x + 16} 
                    y={pos.y - 13} 
                    fontSize="9.5" 
                    fontWeight="800" 
                    fill="var(--text-secondary)" 
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {m.step}
                  </text>

                  {/* Title Label with Subtle Glass Pill */}
                  <text 
                    x={pos.x + labelXOffset} 
                    y={pos.y + labelYOffset + (isMobile ? 4 : 0)} 
                    fontSize="12.5" 
                    fontWeight="700" 
                    fill={isActive ? goalColor : 'var(--text-primary)'} 
                    textAnchor={textAnchor}
                    style={{ pointerEvents: 'none', letterSpacing: '-0.01em' }}
                  >
                    {m.text?.length > 24 ? m.text.substring(0, 24) + '…' : (m.text || `Milestone ${m.step}`)}
                  </text>
                </g>
              );
            })}

            {/* PROGRESS AVATAR / BEACON INDICATOR */}
            {enrichedMilestones.length > 0 && (
              <g style={{ 
                transform: `translate(${getCoordinates(avatarIndex, isMobile).x}px, ${getCoordinates(avatarIndex, isMobile).y - 40}px)`,
                transition: 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}>
                <path d="M 0 0 L -9 -14 A 11 11 0 1 1 9 -14 Z" fill={goalColor} filter="drop-shadow(0 4px 8px rgba(0,0,0,0.25))" />
                <circle cx="0" cy="-18" r="4.5" fill="white" />
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* HTML POPOVER / TOOLTIP */}
      {hoveredNode && (
        <div className="roadmap-popover">
          {(() => {
            const m = enrichedMilestones.find(x => (x.id || `node-${x.step - 1}`) === hoveredNode);
            if (!m) return null;
            return (
              <>
                <div className="popover-header">
                  <span className={`status-badge ${m.state}`}>
                    {m.state === 'completed' ? '✓ Completed' : m.state === 'active' ? '⚡ In Progress' : '🔒 Locked'}
                  </span>
                  <span className="step-count">Step {m.step}</span>
                </div>
                <h4 className="popover-title">{m.text || 'Untitled Milestone'}</h4>
                {m.state === 'locked' && (
                  <p className="popover-desc locked-text">Complete earlier steps on the roadmap to unlock this stage.</p>
                )}
                {m.state === 'active' && (
                  <p className="popover-desc active-text">Current active checkpoint on your journey.</p>
                )}
                {m.state === 'completed' && (
                  <p className="popover-desc completed-text">Stage successfully accomplished!</p>
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
          margin: 16px 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
        }

        .roadmap-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-color);
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(8px);
          flex-wrap: wrap;
          gap: 8px;
        }

        .roadmap-stage-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .stage-pill {
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 20px;
          letter-spacing: 0.5px;
        }
        .stage-target {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .zoom-controls {
          display: flex;
          align-items: center;
          gap: 4px;
          background: var(--surface);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 2px 4px;
        }
        .zoom-btn {
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 0.95rem;
          font-weight: 800;
          width: 24px;
          height: 24px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.15s;
        }
        .zoom-btn:hover {
          background: var(--surface-low);
          color: #8b5cf6;
        }
        .zoom-indicator {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-muted);
          padding: 0 4px;
          cursor: pointer;
          user-select: none;
        }
        .zoom-indicator:hover {
          color: var(--text-primary);
        }

        .svg-wrapper {
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: thin;
          padding: 16px;
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
            padding: 10px;
          }
        }

        .svg-zoom-layer {
          transition: transform 0.25s cubic-bezier(0.2, 0, 0, 1);
        }

        .roadmap-popover {
          position: absolute;
          top: 60px;
          right: 16px;
          width: 260px;
          background: var(--surface);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 14px;
          box-shadow: 0 12px 30px rgba(0,0,0,0.15);
          pointer-events: none;
          animation: pop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          z-index: 10;
        }
        @keyframes pop {
          from { opacity: 0; transform: scale(0.95) translateY(6px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .popover-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .status-badge {
          font-size: 0.68rem;
          font-weight: 800;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 6px;
        }
        .status-badge.completed { background: rgba(16,185,129,0.15); color: #10b981; }
        .status-badge.active { background: rgba(139,92,246,0.15); color: #8b5cf6; }
        .status-badge.locked { background: var(--surface-low); color: var(--text-muted); }
        .step-count {
          font-size: 0.72rem;
          color: var(--text-secondary);
          font-weight: 700;
        }
        .popover-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 6px 0;
          line-height: 1.3;
        }
        .popover-desc {
          font-size: 0.78rem;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.4;
        }
        .locked-text { color: var(--text-muted); font-style: italic; }
        .active-text { color: ${goalColor}; font-weight: 600; }
        .completed-text { color: #10b981; font-weight: 600; }
      `}</style>
    </div>
  );
}
