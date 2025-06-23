import React, { useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { NetworkGraphData, NetworkNode, SimulationResult } from '../pages/SimulationResult';

interface NetworkGraphProps {
  simulationResult: SimulationResult;
}

export default function NetworkGraph({ simulationResult }: NetworkGraphProps) {
  const fgRef = useRef<any>(null);

  useEffect(() => {
    if (fgRef.current) {
      (fgRef.current as any).zoomToFit(400);
    }
  }, [simulationResult.network_graph]);

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

  return (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
      <div>
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
      <div style={{ flex: 1 }}>
        <ForceGraph2D
          ref={fgRef}
          graphData={simulationResult.network_graph}
          nodeLabel="id"
          nodeVal={5}
          nodeColor={getNodeColor}
          linkColor={() => 'rgba(255,255,255,0.2)'}
        />
      </div>
    </div>
  );
}