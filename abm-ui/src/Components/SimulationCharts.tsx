import {Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Legend, Tooltip} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Legend, Tooltip);

interface Props {
  data: {
    liberal: number[];
    conservative: number[];
    neutral: number[];
    stubborn_ratios: number[];
  };
}

export default function SimulationChart({ data }: Props) {
  const steps = data.liberal.map((_, i) => i + 1);

  const commonOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: { title: { display: true, text: 'Step' } },
      y: { title: { display: true, text: 'Count' } },
    },
  };

  const ideologyData = {
    labels: steps,
    datasets: [
      {
        label: 'Liberal',
        data: data.liberal,
        borderColor: '#8884d8',
        fill: false,
      },
      {
        label: 'Conservative',
        data: data.conservative,
        borderColor: '#ff0000',
        fill: false,
      },
      {
        label: 'Neutral',
        data: data.neutral,
        borderColor: '#999999',
        fill: false,
      },
    ],
  };

  const stubbornData = {
    labels: steps,
    datasets: [
      {
        label: 'Stubbornness Ratio',
        data: data.stubborn_ratios,
        borderColor: '#00cc66',
        fill: false,
      },
    ],
  };

  return (
    <div>
      <h2>Ideology Over Time</h2>
      <Line data={ideologyData} options={commonOptions} />

      <h2 style={{ marginTop: '2rem' }}>Stubbornness Ratio</h2>
      <Line data={stubbornData} options={commonOptions} />
    </div>
  );
}
