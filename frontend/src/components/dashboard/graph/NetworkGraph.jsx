import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

export default function NetworkGraph({ nodes, edges, onNodeClick, selectedNodeId }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const degreeMap = {};
    edges.forEach(e => {
      degreeMap[e.source] = (degreeMap[e.source] || 0) + 1;
      degreeMap[e.target] = (degreeMap[e.target] || 0) + 1;
    });

    const nodeRiskMap = {};
    nodes.forEach(n => {
      nodeRiskMap[n.id] = n.risk_score || 0;
    });

    const criticalNodes = [];
    const mediumNodes = [];
    const locationNodes = [];
    const lowNodes = [];

    nodes.forEach(n => {
      const risk = n.risk_score || 0;
      const type = n.type ? n.type.toUpperCase() : '';
      
      if (risk >= 80) criticalNodes.push(n);
      else if (type === 'LOCATION') locationNodes.push(n);
      else if (risk >= 50) mediumNodes.push(n);
      else lowNodes.push(n);
    });

    const getHorizontalPositions = (nodesList, startX, endX, y) => {
      const count = nodesList.length;
      if (count === 0) return {};
      const step = (endX - startX) / (count + 1);
      const positions = {};
      nodesList.forEach((n, i) => {
        positions[n.id] = { x: startX + step * (i + 1), y: y };
      });
      return positions;
    };

    const getVerticalPositions = (nodesList, x, startY, endY) => {
      const count = nodesList.length;
      if (count === 0) return {};
      const step = (endY - startY) / (count + 1);
      const positions = {};
      nodesList.forEach((n, i) => {
        positions[n.id] = { x: x, y: startY + step * (i + 1) };
      });
      return positions;
    };

    const posMap = {
      ...getHorizontalPositions(criticalNodes, 200, 800, 100),
      ...getHorizontalPositions(mediumNodes, 200, 800, 300),
      ...getHorizontalPositions(lowNodes, 200, 800, 500)
    };

    const leftLocs = locationNodes.slice(0, Math.ceil(locationNodes.length / 2));
    const rightLocs = locationNodes.slice(Math.ceil(locationNodes.length / 2));
    Object.assign(posMap, getVerticalPositions(leftLocs, 100, 100, 500));
    Object.assign(posMap, getVerticalPositions(rightLocs, 900, 100, 500));

    const elements = [
      ...nodes.map(n => ({
        data: {
          id: n.id,
          name: n.label,
          risk: n.risk_score || 0,
          type: n.type,
          degree: degreeMap[n.id] || 0
        },
        position: posMap[n.id] || { x: 0, y: 0 }
      })),
      ...edges.map(e => {
        const sourceRisk = nodeRiskMap[e.source] || 0;
        const targetRisk = nodeRiskMap[e.target] || 0;
        return {
          data: {
            id: `e_${e.id}`,
            source: e.source,
            target: e.target,
            weight: e.weight,
            type: e.type,
            risk: Math.max(sourceRisk, targetRisk)
          }
        };
      })
    ];

    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#0a0a0a',
            'border-width': 3,
            'border-color': '#00FF41',
            'shadow-blur': 15,
            'shadow-color': '#00FF41',
            'shadow-opacity': 0.5,
            'label': 'data(name)',
            'color': '#FFFFFF',
            'text-outline-color': '#000000',
            'text-outline-width': 2,
            'text-valign': 'bottom',
            'text-margin-y': 8,
            'font-family': 'sans-serif',
            'font-size': '10px',
            'width': 'mapData(degree, 0, 15, 10, 80)',
            'height': 'mapData(degree, 0, 15, 10, 80)',
            'transition-property': 'border-color, shadow-color',
            'transition-duration': '0.3s'
          }
        },
        {
          selector: 'node[type = "LOCATION"]',
          style: {
            'border-color': '#B200FF',
            'shadow-color': '#B200FF'
          }
        },
        {
          selector: 'node[type = "PHONE"]',
          style: {
            'border-color': '#00E5FF',
            'shadow-color': '#00E5FF'
          }
        },
        {
          selector: 'node[type = "PERSON"]',
          style: {
            'border-color': '#FF8C00',
            'shadow-color': '#FF8C00'
          }
        },
        {
          selector: 'node[risk >= 80]',
          style: {
            'border-color': '#FF003C',
            'shadow-color': '#FF003C'
          }
        },
        {
          selector: 'node[risk >= 50][risk < 80]',
          style: {
            'border-color': '#FFE600',
            'shadow-color': '#FFE600'
          }
        },
        {
          selector: 'node[degree = 0]',
          style: {
            'width': 20,
            'height': 20,
            'font-size': '8px',
            'border-width': 2
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': '#00FF41',
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#00FF41',
            'arrow-scale': 0.8,
            'opacity': 0.5
          }
        },
        {
          selector: 'edge[type = "CALLED"]',
          style: {
            'line-color': '#00E5FF',
            'target-arrow-color': '#00E5FF',
            'width': 4,
            'arrow-scale': 1.5,
            'shadow-color': '#00E5FF'
          }
        },
        {
          selector: 'edge[type = "ASSOCIATED_WITH"]',
          style: {
            'line-color': '#00c431',
            'target-arrow-color': '#00c431',
            'width': 1.5
          }
        },
        {
          selector: 'edge[risk > 50]',
          style: {
            'line-style': 'solid',
            'opacity': 1.0,
            'shadow-blur': 12,
            'shadow-opacity': 0.8
          }
        },
        {
          selector: 'edge[risk <= 50]',
          style: {
            'line-style': 'dashed',
            'line-dash-pattern': [6, 6],
            'opacity': 0.5
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#FFFFFF',
            'shadow-color': '#FFFFFF',
            'shadow-blur': 25,
            'shadow-opacity': 1
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#FFFFFF',
            'line-opacity': 0.9,
            'shadow-color': '#FFFFFF',
            'shadow-blur': 15,
            'target-arrow-color': '#FFFFFF'
          }
        },
        {
          selector: '.faded',
          style: {
            'opacity': 0.15,
            'transition-property': 'opacity',
            'transition-duration': '0.3s'
          }
        }
      ],
      layout: {
        name: 'preset',
        animate: true,
        animationDuration: 1500,
        fit: true,
        padding: 50
      }
    });

    cy.on('tap', 'node', function(evt){
      const node = evt.target;
      if(onNodeClick) {
        onNodeClick(node.data());
      }
    });

    cy.on('tap', function(evt){
      if(evt.target === cy){
        if(onNodeClick) {
          onNodeClick(null);
        }
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [nodes, edges]);

  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    
    if (selectedNodeId) {
      const node = cy.getElementById(selectedNodeId);
      if (node.length > 0) {
        const neighborhood = node.neighborhood().add(node);
        cy.elements().addClass('faded');
        neighborhood.removeClass('faded');
      }
    } else {
      cy.elements().removeClass('faded');
    }
  }, [selectedNodeId, nodes, edges]);

  useEffect(() => {
    if (!cyRef.current) return;

    let animationFrameId;
    let offset = 0;
    const animateEdges = () => {
      offset -= 0.5;
      if (cyRef.current && !cyRef.current.destroyed()) {
        cyRef.current.edges().style('line-dash-offset', offset);
        animationFrameId = requestAnimationFrame(animateEdges);
      }
    };
    animateEdges();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [nodes, edges]);

  return (
    <div className="w-full relative h-[600px] rounded-lg overflow-hidden border border-[#00FF41]/30 bg-[#02050A]">
      {/* 2D Flat Grid Background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 65, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 65, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          backgroundColor: '#050a12'
        }}
      ></div>

      {/* Cytoscape Canvas */}
      <div 
        ref={containerRef} 
        className="absolute inset-0 z-10"
      ></div>

      {/* Controls */}
      <div className="absolute top-4 right-4 z-20 bg-black/70 border border-neonCyan/50 p-2 rounded flex gap-2 shadow-[0_0_10px_rgba(0,255,255,0.3)]">
        <button onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 1.2)} className="text-neonGreen hover:text-white px-2 py-1 rounded bg-black/50 transition-colors">🔍+</button>
        <button onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 0.8)} className="text-neonGreen hover:text-white px-2 py-1 rounded bg-black/50 transition-colors">🔍-</button>
        <button onClick={() => cyRef.current?.fit()} className="text-neonGreen hover:text-white px-2 py-1 rounded bg-black/50 transition-colors">⟲</button>
      </div>
      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-black/70 border border-neonCyan/50 p-3 rounded text-white text-[11px] w-[180px] shadow-[0_0_10px_rgba(0,255,255,0.3)] backdrop-blur-sm">
        <div className="text-gray-400 font-bold mb-2 border-b border-gray-800 pb-1">Entity Threat Levels</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 border-2 border-[#FF003C] rounded-full shadow-[0_0_8px_#FF003C]"></span> Critical Risk (Red)</div>
        <div className="flex items-center gap-2 mt-2"><span className="w-3 h-3 border-2 border-[#FFE600] rounded-full shadow-[0_0_8px_#FFE600]"></span> Medium Risk (Yellow)</div>
        <div className="flex items-center gap-2 mt-2"><span className="w-3 h-3 border-2 border-[#B200FF] rounded-full shadow-[0_0_8px_#B200FF]"></span> Location</div>
        <div className="flex items-center gap-2 mt-2"><span className="w-3 h-3 border-2 border-[#00FF41] rounded-full shadow-[0_0_8px_#00FF41]"></span> Low Risk / Other</div>
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-800"><span className="w-5 h-[2px] bg-[#00FF41] shadow-[0_0_8px_#00FF41]"></span> Association</div>
        <div className="flex items-center gap-2 mt-2"><span className="w-5 h-[3px] border-b-2 border-dashed border-[#00E5FF] shadow-[0_0_8px_#00E5FF]"></span> Direct Call</div>
      </div>
    </div>
  );
}
