import React, { useState } from 'react';
import NetworkGraph from '../Components/NetworkGraph';
import '../pages/SimulationResult.scss';

export interface NetworkNode {
  id: string;
  type?: string;
  x?: number;
  y?: number;
}

export interface NetworkLink {
  source: string;
  target: string;
}

export interface NetworkGraphData {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

export interface SimulationResult{
  counts: {
    liberal: number[];
    conservative: number[];
    neutral: number[];
  };
  stubborn_ratios: number[];
  average_age: number; 
  final_counts: {
    liberal: number;
    conservative: number;
    neutral: number;
  };
  media_influence_summary: string;
  network_graph?: NetworkGraphData;
}

function SimulationResult() {
  const [agentCount, setAgentCount] = useState<number>(200);
  const [stepCount, setStepCount] = useState<number>(40);
  const [results, setResults] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunSimulation = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('http://127.0.0.1:8001/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_count: agentCount,
          step_count: stepCount,
        }),
      });
      if(!response.ok){
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: SimulationResult = await response.json();
      setResults(data);
    }
    catch (e: any){
      setError(e.message || 'Failed to run simulation');
      console.error("Simulation error: ", e);
    }
    finally {
      setIsLoading(false);
    }
  };

  return (    
    <div className='container'>
      <div className='upper'>
        <h1>Welcome to ABM Simulation Game!</h1>
        <div className='input-container'>
          <label htmlFor="agentCountInput">
            Agent Count:
            <input 
              id="agentCountInput"
              type="number"
              value={agentCount}
              onChange={(e) => setAgentCount(parseInt(e.target.value, 10))}
            />
          </label>
        </div>
        <div className='input-container'>
          <label htmlFor="stepCountInput">
            Step Count:
            <input 
              id="stepCountInput"
              type="number"
              value={stepCount}
              onChange={(e) => setStepCount(parseInt(e.target.value, 10))}
            />
          </label>
        </div>
        <button onClick={handleRunSimulation} disabled={isLoading}>
          {isLoading ? "Simulating..." : "Run Simulation"}
        </button>
      </div>
      {error && <p style={{color: "red"}}> Error: {error}</p>}
      <div className='result-container'>
        {results && results.network_graph && (
          <div className='results'>
            <h2>Simulation Results:</h2>
            <NetworkGraph simulationResult={results} />
          </div>
        )}
      </div>
    
    </div>
 
  )
}

export default SimulationResult;
