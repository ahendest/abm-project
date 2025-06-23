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

@app.post("/simulate")
def simulate(input_data: SimulationInput):
    # FastAPI will automatically validate the incoming JSON against SimulationInput
    # and parse it into the input_data object.
    result = run_simulation(N=input_data.agent_count, steps=input_data.step_count)
    return result
