import React, { useState } from 'react';
import SimulationCharts from '../Components/SimulationCharts';
import '../pages/SimulationResult.scss';

interface SimulationResult{
  counts: {
    liberal: number[];
    conservative: number[];
    neutral: number[];
  };
  stubborn_ratios: number[];
  average_age: number; // Assuming average_age is a single number based on common usage. Adjust if it's an array from the API.
  final_counts: {
    liberal: number;
    conservative: number;
    neutral: number;
  };
  media_influence_summary: string;
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
        {results && (
          <div className='results'>
            <h2>Simulation Results:</h2>
            {/* Simplified data passing, assuming SimulationResult type is accurate */}
            <SimulationCharts data={{
              liberal: results.counts.liberal,
              conservative: results.counts.conservative,
              neutral: results.counts.neutral,
              stubborn_ratios: results.stubborn_ratios
            }} />
          </div>
        )}
      </div>
    
    </div>
 
  )
}

export default SimulationResult;
