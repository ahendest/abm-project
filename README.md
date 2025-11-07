# ABM Project

Agent-based simulation playground that models the evolution of political ideologies under social-network pressure and media events. The repository contains a FastAPI backend that runs the Mesa simulation and a React frontend that visualises the results (3D graph, charts, and detailed tables).

## Repository Structure

- `abm-backend/` – FastAPI app wrapping the Mesa model (`/simulate` endpoint), plus the simulation logic in `simulation.py`.
- `abm-ui/` – React + TypeScript single-page app that lets you configure a run and inspect the outputs.

## Simulation Highlights

- **Scale-free social network**: Agents are seeded on a Barabási–Albert graph and can gain edges when they reach adulthood.
- **Life-cycle dynamics**: Agents age, die, and new agents are born each step; stubbornness decays over time.
- **Media and propaganda events**: Every ~30 steps the model can trigger influence bursts targeting subsets of the population.
- **Data collection**: Mesa’s `DataCollector` captures per-step ideology counts, average age, and per-agent snapshots. These are exposed to the frontend for rich analytics.

## FOR NERDS

Deep dive into the math that powers `abm-backend/simulation.py`:

- **Edge formation via preferential attachment** – Initial networks are generated with `nx.barabasi_albert_graph(N, 5)`, producing a scale-free degree distribution (power-law) so new nodes attach to high-degree hubs more often. When an agent turns 18, it adds up to four new edges by uniformly sampling from the rest of the population, which injects stochastic rewiring on top of the Barabási–Albert core.
- **Geometric embedding & KD-tree acceleration** – Each agent receives a 2D coordinate sampled uniformly from `[0, 10]²`. These coordinates are stored in a NumPy array and fed into SciPy’s `cKDTree`, which allows Euclidean distances and neighbor queries to be evaluated in `O(log n)` time instead of `O(n)`. The KD-tree underpins spatial reasoning, e.g., picking geographically close peers or evaluating neighborhood density without recomputing pairwise distances.
- **Neighbor statistics** – For runtime diagnostics the model leverages NetworkX’s `average_neighbor_degree` and Python’s `collections.Counter` to compute majority ideology among neighbors efficiently, ensuring ideology flips follow the modal opinion around every agent.

These techniques keep the simulation performant even when you raise the agent count into the thousands while still reflecting network science realities (preferential attachment) and spatial correlation (KD-tree backed distance checks).

## Prerequisites

- Python 3.12+ (the virtual environment in `abm-backend/.venv` targets CPython 3.12/3.13).
- Node.js 18+ with npm.
- (Recommended) Git for version control.

## Backend Setup

```powershell
cd abm-backend
python -m venv .venv                # optional if you do not already have one
.venv\Scripts\activate              # Windows PowerShell
pip install -r requirements.txt     # installs FastAPI, Mesa, pandas, matplotlib, etc.
uvicorn main:app --reload #start backend, or: 
python -m uvicorn main:app --reload #choose port:
python -m uvicorn main:app --reload --port 8001
```

The API is now available on `http://127.0.0.1:8001`.

### API Reference

`POST /simulate`

Request body:

```json
{
  "agent_count": 200,
  "step_count": 40
}
```

Response payload (abridged):

```jsonc
{
  "counts": { "liberal": [...], "conservative": [...], "neutral": [...] },
  "stubborn_ratios": [...],
  "average_age": 37.4,
  "final_counts": { "liberal": 210, "conservative": 198, "neutral": 95 },
  "media_influence_summary": "Media influenced agents 3 times...",
  "network_graph": { "nodes": [...], "links": [...] },
  "model_timeseries": [
    { "step": 1, "liberal": 70, "conservative": 65, "neutral": 65, "average_age": 34.2 }
  ],
  "agent_snapshots": [
    { "step": 1, "agent_id": 12, "ideology": "liberal", "stubbornness": 3, "age": 26 }
  ]
}
```

## Frontend Setup

```powershell
cd abm-ui
npm install             # installs React, react-force-graph, Chart.js, etc.
npm start               # starts dev server on http://localhost:3000
```

Open the browser at `http://localhost:3000`, enter the desired agent & step counts, and click **Run Simulation**. The app will:

- Render the 3D force-directed network (colour-coded by ideology).
- Plot ideology trends and stubbornness ratios over time.
- Display tabular timelines and agent snapshots (filterable by step).

## Development Tips

- The backend depends on scientific libraries (`mesa`, `numpy`, `pandas`, `matplotlib`, `networkx`, `scipy`). If `uvicorn` raises `ModuleNotFoundError`, re-run `pip install -r requirements.txt` inside the active virtual environment.
- The frontend uses the default Create React App tooling; run `npm test` for UI tests or `npm run build` for production bundles.
- Update CORS origins in `abm-backend/main.py` if you decide to serve the frontend from a different host/port.

## Troubleshooting

- **`EJSONPARSE` when running npm commands**: Ensure you are inside `abm-ui/`; the root-level `package.json` is intentionally empty.
- **`ModuleNotFoundError: mesa`**: Install backend requirements (see above) inside `.venv`.
- **Port conflicts**: Adjust `uvicorn` port (`--port 8001`) or React dev server proxy settings if those ports are in use.

## Future Improvements

- Persist simulation runs for replay/comparison.
- Introduce parameter controls for media influence probabilities and network topology.
- Add automated test suites for both FastAPI routes and React components.

Happy simulating!
