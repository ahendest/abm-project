import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { NetworkGraphData, NetworkNode, SimulationResponse } from '../pages/SimulationResult';
import '../Components/NetworkGraph.scss'
import ForceGraph3D from 'react-force-graph-3d';
interface NetworkGraphProps {
  simulationResult: SimulationResponse;
}

export default function NetworkGraph({ simulationResult }: NetworkGraphProps) {
  const fgRef = useRef<any>(null); // Ref for ForceGraph3D component
  const containerRef = useRef<HTMLDivElement>(null); // Ref for the div wrapping the graph

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const getNodeColor = (node: NetworkNode) => {
    switch (node.type) {
      case 'liberal':
        return '#8884d8';
      case 'conservative':
        return '#ff0000';
      case 'neutral':
        return '#999999';
      default:
        return '#ffffff';
    }
  };

  // Use useLayoutEffect for initial sizing to prevent flash of incorrect size
  useLayoutEffect(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.offsetWidth);
      setHeight(containerRef.current.offsetHeight);
    }
  }, []);

  // Use useEffect for ResizeObserver to handle dynamic resizing
  useEffect(() => {
    if (!containerRef.current) return;

    let lastWidth = 0;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (Math.abs(width - lastWidth) < 1) return;
        lastWidth = width;

        requestAnimationFrame(() => {
          setWidth(width);
          setHeight(height);
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);


  return (
    <div className='result-container'>
      <div className='upper-container'>
        <h3>Simulation Info</h3>
        <ul>
          <li><b>Average Age:</b> {simulationResult.average_age.toFixed(2)}</li>
          <li><b>Media Influence:</b> {simulationResult.media_influence_summary}</li>
          <li>
            <b>Final Counts:</b>
            <ul>
              <li>Liberal: {simulationResult.final_counts.liberal}</li>
              <li>Conservative: {simulationResult.final_counts.conservative}</li>
              <li>Neutral: {simulationResult.final_counts.neutral}</li>
            </ul>
          </li>
          <li>
            <b>Stubborn Ratios:</b>
            <ul>
              {simulationResult.stubborn_ratios.map((ratio, idx) => (
                <li key={idx}>Step {idx + 1}: {(ratio * 100).toFixed(1)}%</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>
      <div className='lower-container' ref={containerRef}> {/* Attach ref here */}
        {width > 0 && height > 0 && simulationResult.network_graph ? (
          <ForceGraph3D
            ref={fgRef}
            graphData={simulationResult.network_graph}
            nodeLabel="id"
            nodeVal={5}
            nodeColor={getNodeColor}
            linkColor={() => 'rgba(255,255,255,0.2)'}
            width={width}
            height={height}
          />
        ) : (
          <p>Loading graph...</p>
        )}
      </div>
    </div>
  );
}
