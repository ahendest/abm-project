import React, { MouseEvent, useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
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
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  useEffect(() => {
    if (steps.length > 0 && !steps.includes(selectedStep)) {
      setSelectedStep(steps[0]);
    }
  }, [steps, selectedStep]);

  const agentsForStep = useMemo(() => {
    return agentSnapshots.filter((snapshot) => snapshot.step === selectedStep);
  }, [agentSnapshots, selectedStep]);

  const agentHistory = useMemo(() => {
    if (selectedAgentId === null) return [];
    return agentSnapshots
      .filter((snapshot) => String(snapshot.agent_id) === selectedAgentId)
      .sort((a, b) => a.step - b.step);
  }, [agentSnapshots, selectedAgentId]);

  const handleAgentClick = (agentId: string, event?: MouseEvent) => {
    event?.stopPropagation();
    setSelectedAgentId((prev) => (prev === agentId ? null : agentId));
  };

  const ideologyValueMap: Record<string, number> = {
    conservative: -1,
    neutral: 0,
    liberal: 1,
  };

  const historyChartData = agentHistory.map((entry) => ({
    step: entry.step,
    stubbornness: entry.stubbornness,
    age: entry.age,
    ideologyValue: ideologyValueMap[entry.ideology] ?? 0,
  }));

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
                  {agentsForStep.map((agent) => {
                    const agentId = String(agent.agent_id);
                    return (
                      <tr
                        key={`${agent.step}-${agentId}`}
                        className={selectedAgentId === agentId ? 'selected-row' : ''}
                        onClick={() => handleAgentClick(agentId)}
                      >
                        <td className='agent-link'>
                          <button type='button' onClick={(event) => handleAgentClick(agentId, event)}>
                            {agentId}
                          </button>
                        </td>
                        <td className={`ideology ideology--${agent.ideology}`}>
                          {agent.ideology}
                        </td>
                        <td>{agent.stubbornness}</td>
                        <td>{agent.age}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className='agent-history'>
                {selectedAgentId === null ? (
                  <p className='empty-state'>Select an Agent ID to inspect their evolution over time.</p>
                ) : agentHistory.length === 0 ? (
                  <p className='empty-state'>No history found for agent #{selectedAgentId}.</p>
                ) : (
                  <>
                    <div className='agent-history__header'>
                      <h3>Agent #{selectedAgentId} – Step-by-step</h3>
                      <button type='button' onClick={() => setSelectedAgentId(null)}>
                        Clear
                      </button>
                    </div>
                    <table className='data-table compact'>
                      <thead>
                        <tr>
                          <th>Step</th>
                          <th>Ideology</th>
                          <th>Stubbornness</th>
                          <th>Age</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agentHistory.map((entry) => (
                          <tr key={`${entry.step}-${entry.agent_id}`}>
                            <td>{entry.step}</td>
                            <td className={`ideology ideology--${entry.ideology}`}>
                              {entry.ideology}
                            </td>
                            <td>{entry.stubbornness}</td>
                            <td>{entry.age}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className='agent-history__chart'>
                      <ResponsiveContainer width='100%' height={250}>
                        <LineChart data={historyChartData}>
                          <CartesianGrid strokeDasharray='3 3' />
                          <XAxis dataKey='step' />
                          <YAxis yAxisId='left' label={{ value: 'Age / Stubbornness', angle: -90, position: 'insideLeft' }} />
                          <YAxis
                            yAxisId='right'
                            orientation='right'
                            domain={[-1.2, 1.2]}
                            ticks={[-1, -0.5, 0, 0.5, 1]}
                            label={{ value: 'Ideology (Cons=-1, Neu=0, Lib=1)', angle: 90, position: 'insideRight' }}
                          />
                          <Tooltip />
                          <Legend />
                          <Line yAxisId='left' type='monotone' dataKey='age' stroke='#34d399' name='Age' dot={false} />
                          <Line yAxisId='left' type='monotone' dataKey='stubbornness' stroke='#fbbf24' name='Stubbornness' dot={false} />
                          <Line yAxisId='right' type='stepAfter' dataKey='ideologyValue' stroke='#60a5fa' name='Ideology' dot />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
