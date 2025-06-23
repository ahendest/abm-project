from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from simulation import run_simulation

app = FastAPI()

# CORS ayarları (React ile iletişim için)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend adresi
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Kullanıcıdan gelecek veriler için model
class SimulationInput(BaseModel):
    agent_count: int
    step_count: int

class NetwrokNode(BaseModel):
    id: str
    type: str
    x: float | None = None
    y: float | None = None
    
class NetworkLink(BaseModel):
    source: str
    target: str
    
class NetworkGraphData(BaseModel):
    nodes: list[NetwrokNode]
    links: list[NetworkLink]

class SimulationResult(BaseModel):
    counts: dict
    stubborn_ratios: list[float]
    average_age: float
    final_counts: dict
    media_influence_summary: str
    network_graph: NetworkGraphData

@app.post("/simulate", response_model=SimulationResult)
def simulate(input_data: SimulationInput):
    result = run_simulation(N=input_data.agent_count, steps = input_data.step_count)
    return result

