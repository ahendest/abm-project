import React, { useEffect, useMemo, useState } from 'react';
import { AgentSnapshot, ModelTimeseriesPoint } from '../pages/SimulationResult';
import './SimulationDataPanel.scss';

interface SimulationDataPanelProps {
  modelTimeseries: ModelTimeseriesPoint[];
  agentSnapshots: AgentSnapshot[];
}

type ActiveView = 'model' | 'agents';

export default function SimulationDataPanel({
  modelTimeseries,
  agentSnapshots,
}: SimulationDataPanelProps) {
  const [activeView, setActiveView] = useState<ActiveView>('model');

  const steps = useMemo(() => {
    const stepSet = new Set<number>();
    agentSnapshots.forEach((snapshot) => stepSet.add(snapshot.step));
    return Array.from(stepSet).sort((a, b) => a - b);
  }, [agentSnapshots]);

  const [selectedStep, setSelectedStep] = useState<number>(steps[0] ?? 1);

  useEffect(() => {
    if (steps.length > 0 && !steps.includes(selectedStep)) {
      setSelectedStep(steps[0]);
    }
  }, [steps, selectedStep]);

  const agentsForStep = useMemo(() => {
    return agentSnapshots.filter((snapshot) => snapshot.step === selectedStep);
  }, [agentSnapshots, selectedStep]);

  return (
    <div className='data-panel'>
      <div className='data-panel__header'>
        <h2>Detailed Metrics</h2>
        <div className='data-panel__tabs'>
          <button
            className={activeView === 'model' ? 'active' : ''}
            onClick={() => setActiveView('model')}
            type='button'
          >
            Model Timeline
          </button>
          <button
            className={activeView === 'agents' ? 'active' : ''}
            onClick={() => setActiveView('agents')}
            type='button'
          >
            Agent Snapshots
          </button>
        </div>
      </div>

      {activeView === 'model' ? (
        <div className='table-wrapper'>
          {modelTimeseries.length === 0 ? (
            <p className='empty-state'>No model timeline data captured.</p>
          ) : (
            <table className='data-table'>
              <thead>
                <tr>
                  <th>Step</th>
                  <th>Liberal</th>
                  <th>Conservative</th>
                  <th>Neutral</th>
                  <th>Average Age</th>
                </tr>
              </thead>
              <tbody>
                {modelTimeseries.map((entry) => (
                  <tr key={entry.step}>
                    <td>{entry.step}</td>
                    <td>{entry.liberal}</td>
                    <td>{entry.conservative}</td>
                    <td>{entry.neutral}</td>
                    <td>{entry.average_age.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className='table-wrapper'>
          {agentSnapshots.length === 0 ? (
            <p className='empty-state'>No agent snapshots recorded.</p>
          ) : (
            <>
              <div className='agent-controls'>
                <label htmlFor='stepSelect'>
                  Step
                  <select
                    id='stepSelect'
                    value={selectedStep}
                    onChange={(event) => setSelectedStep(Number(event.target.value))}
                  >
                    {steps.map((step) => (
                      <option key={step} value={step}>
                        {step}
                      </option>
                    ))}
                  </select>
                </label>
                <span>{agentsForStep.length} agents</span>
              </div>
              <table className='data-table'>
                <thead>
                  <tr>
                    <th>Agent ID</th>
                    <th>Ideology</th>
                    <th>Stubbornness</th>
                    <th>Age</th>
                  </tr>
                </thead>
                <tbody>
                  {agentsForStep.map((agent) => (
                    <tr key={`${agent.step}-${agent.agent_id}`}>
                      <td>{agent.agent_id}</td>
                      <td className={`ideology ideology--${agent.ideology}`}>
                        {agent.ideology}
                      </td>
                      <td>{agent.stubbornness}</td>
                      <td>{agent.age}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
}
