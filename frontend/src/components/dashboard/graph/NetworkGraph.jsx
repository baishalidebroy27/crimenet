import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
const personIcon = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g transform="translate(32, 0)"><path fill="#ffffff" d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"/></g></svg>');
const locationIcon = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g transform="translate(64, 0)"><path fill="#ffffff" d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"/></g></svg>');
const phoneIcon = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#ffffff" d="M493.4 24.6l-104-24c-11.3-2.6-22.9 3.3-27.5 13.9l-48 112c-4.2 9.8-1.4 21.3 6.9 28l60.6 49.6c-36 76.7-98.9 140.5-177.2 177.2l-49.6-60.6c-6.8-8.3-18.2-11.1-28-6.9l-112 48C3.9 366.5-2 378.1.6 389.4l24 104C27.1 504.2 36.7 512 48 512c256.1 0 464-207.5 464-464 0-11.2-7.7-20.9-18.6-23.4z"/></svg>');
const dateIcon = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g transform="translate(32, 0)"><path fill="#ffffff" d="M400 64h-48V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H160V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48zm-6 400H54c-3.3 0-6-2.7-6-6V160h352v298c0 3.3-2.7 6-6 6z"/></g></svg>');
const orgIcon = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#ffffff" d="M496 128v16a8 8 0 0 1-8 8h-24v12c0 6.6-5.4 12-12 12H60c-6.6 0-12-5.4-12-12v-12H24a8 8 0 0 1-8-8v-16a8 8 0 0 1 4.7-7.3l236-112a8 8 0 0 1 6.6 0l236 112a8 8 0 0 1 4.7 7.3zm-32 64v214c0 3.3-2.7 6-6 6H54c-3.3 0-6-2.7-6-6V192h416zm-40 256v22a10 10 0 0 1-10 10H66a10 10 0 0 1-10-10v-22a10 10 0 0 1 10-10h348a10 10 0 0 1 10 10zM128 224v128c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V224c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16zm96 0v128c0 8.8-7.2 16-16 16h-32c-8.8 0-16-7.2-16-16V224c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16zm96 0v128c0 8.8-7.2 16-16 16h-32c-8.8 0-16-7.2-16-16V224c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16zm96 0v128c0 8.8-7.2 16-16 16h-32c-8.8 0-16-7.2-16-16V224c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16z"/></svg>');

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
          degree: degreeMap[n.id] || 0,
          dob: n.dob,
          nationality: n.nationality,
          last_seen: n.last_seen
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
            'font-size': '12px',
            'width': 'mapData(degree, 0, 15, 35, 100)',
            'height': 'mapData(degree, 0, 15, 35, 100)',
            'transition-property': 'border-color, shadow-color',
            'transition-duration': '0.3s',
            'background-width': '65%',
            'background-height': '65%'
          }
        },
        {
          selector: 'node[type = "LOCATION"]',
          style: {
            'border-color': '#B200FF',
            'shadow-color': '#B200FF',
            'background-image': locationIcon
          }
        },
        {
          selector: 'node[type = "PHONE"]',
          style: {
            'border-color': '#00E5FF',
            'shadow-color': '#00E5FF',
            'background-image': phoneIcon
          }
        },
        {
          selector: 'node[type = "PERSON"]',
          style: {
            'border-color': '#FF8C00',
            'shadow-color': '#FF8C00',
            'background-image': personIcon
          }
        },
        {
          selector: 'node[type = "DATE"]',
          style: {
            'background-image': dateIcon
          }
        },
        {
          selector: 'node[type = "ORG"]',
          style: {
            'background-image': orgIcon
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
            'width': 35,
            'height': 35,
            'font-size': '10px',
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
