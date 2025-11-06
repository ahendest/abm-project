import json
import random
from collections import Counter

import matplotlib.animation as animation
import matplotlib.pyplot as plt
import mesa
import networkx as nx
import numpy as np
import pandas as pd
from mesa import Agent, Model
from scipy.spatial import cKDTree


class MyAgent(Agent):
  def __init__(self, unique_id, model, ideology, stubborn=0, age=None, education=None,income=None, bias_ideology=None):
    super().__init__(model) 
    self.unique_id = unique_id
    self.model = model
    self.stubborn = stubborn
    self.age = age
    self.education = education if education is not None else random.randint(0,20)
    self.income = income if income is not None else random.randint(600,6000)
    self.last_ideology_change_step = -10
    self.bias_ideology = bias_ideology
    self.resistance_to_change = 0.0
    self.ideology = ideology

  def step(self):
    # find the neighbors and take ideologies
    neighbors = self.model.get_neighbors(self.unique_id)
    neighbor_ideologies = [self.model.schedule.agents[neighbor].ideology for neighbor in neighbors if self.model.schedule.agents[neighbor].age >= 18]
    self.age += 1 #agents gets 1 year older each step
    #give edges after they turn 18
    if self.age == 18:
      possible_neighbors = list(self.model.social_network.nodes)
      eligible_neighbors = [n for n in possible_neighbors if n != self.unique_id]
      num_edges_to_add = min(4, len(eligible_neighbors))
      neighbors_added = random.sample(eligible_neighbors, num_edges_to_add)
      
      for neighbor in neighbors_added:
        self.model.social_network.add_edge(self.unique_id, neighbor)
    
    # Change ideology
    if neighbor_ideologies:
      ideology_counts = Counter(neighbor_ideologies)
      most_common_ideology = ideology_counts.most_common(1)[0][0] # used another library for efficient calc 
      if self.stubborn < 5 and most_common_ideology != self.ideology and self.age > 17 and most_common_ideology != self.bias_ideology:
        ideology_change_probability = 0.15 * (1 - self.resistance_to_change)
        
        #ideology change ratio depends on resistance initially 15%  and at least 20 steps reuqired after firs change
        if random.random() < ideology_change_probability and self.model.schedule.step_count - self.last_ideology_change_step > 19:
          self.ideology = most_common_ideology
          self.last_ideology_change_step = self.model.schedule.step_count

    # Conflict with neighbors
    for neighbor in neighbors:
      neighbor_agent = self.model.schedule.agents.get(neighbor)  
      if neighbor_agent and self.ideology != neighbor_agent.ideology:
        if random.random() < 0.07:  # Conflict probability
          self.stubborn += 1 
          self.resistance_to_change = min(1.0, 0.1 * self.stubborn) #increase the resistence by 10% for every conflict
    
    # Stubbornness decay
    if self.stubborn > 0 and self.model.schedule.step_count % 5 == 0:  # Decay every 5 steps
        self.stubborn -= 1

class CustomScheduler:
  def __init__(self,model):
    self.agents = {}
    self.model = model
    self.step_count = 0
    self.next_id = 0

  def add(self, agent):
    agent.unique_id = self.next_id
    self.agents[agent.unique_id] = agent
    self.next_id += 1
  
  def remove(self, agent_id):
    if agent_id in self.agents:
      del self.agents[agent_id]

  def step(self):
    agents = list(self.agents.values())
    agents_to_remove = []

    for agent in agents:
      if agent.age > 80 and random.random() < 0.8:
        agents_to_remove.append(agent.unique_id)
      else: agent.step()

    for agent_id in agents_to_remove:
      self.model.social_network.remove_edges_from(list(self.model.social_network.edges(agent_id)))
      self.model.social_network.remove_node(agent_id)
      self.remove(agent_id)

    if not agents_to_remove:
      pass
    self.step_count += 1

  def get_agent_count(self):
    return len(self.agents)

class IdeologyModel(Model):  
  def __init__(self, N):
    super().__init__()
    self.num_agents = N
    self.schedule = CustomScheduler(self)
    self.social_network = nx.barabasi_albert_graph(N,5)
    self.media_influence_events = ""
    self.media_influence_count = 0
    self.propaganda_influence_count = 0
    self.media_influence_counter = 0
    self.propaganda_influence_counter = 0
    self.media_influence_events = ""
    

    self.datacollector = mesa.DataCollector(
      model_reporters={
        "Liberal Count": lambda m: m.count_type("liberal"),
        "Conservative Count": lambda m: m.count_type("conservative"),
        "Neutral Count": lambda m: m.count_type("neutral"),
        "Average Age": lambda m: m.avg_age
      },
      agent_reporters={
        "Ideology": "ideology",
        "Stubbornness": "stubborn",
        "Age": "age"
      }
    )
    self.create_population()
    self.update_spatial_data()

  def get_neighbors(self, agent_index):
    return list(self.social_network.neighbors(agent_index)) 

  def update_spatial_data(self): 
    positions = nx.get_node_attributes(self.social_network, 'pos') 
    self.agent_positions = np.array(list(positions.values()))
    if len(self.agent_positions) > 0:
      self.kdtree = cKDTree(self.agent_positions) 

  def create_population(self):  
    for _ in range(self.num_agents):
      age = random.randint(0,80) #assign age
      ideology = "neutral" if age < 18 else random.choice(["conservative", "liberal", "neutral"]) 
      possible_ideologies = (["conservative", "liberal", "neutral"]) #assign ideology
      
      if age >= 18: #assign bias
        possible_ideologies.remove(ideology)
        if random.random() < 0.2:
          bias_ideology = random.choice(possible_ideologies)
        else: bias_ideology = None
      else: bias_ideology = None

      stubborn = random.randint(0,7) #assign the stubbornness of the agent
      agent = MyAgent(None, self, ideology, stubborn, age=age, bias_ideology=bias_ideology) # create agent
      self.schedule.add(agent) # add the agent to schedule
      self.social_network.add_node(agent.unique_id, pos=(random.random()*10,random.random()*10)) # add the agent to the network as a node 
    
  def step(self):
    new_agent_count = random.randint(0,15)
    media_ideology = random.choice(["conservative", "liberal"])
    influence_count_this_step = 0
    propaganda_count_this_step = 0

    if self.schedule.step_count % 30 == 0 and random.random() < 0.6: # media event calc
      influence_type = "influence"
      if random.random() < 0.2:
        influence_type = "propaganda"      
 
      num_influenced = random.randint(100,300) if influence_type == "propaganda" else random.randint(30,100)
      agents_list = list(self.schedule.agents.values())
      influenced_agents = random.sample(agents_list, min(num_influenced, len(self.schedule.agents)))
      
      for agent in influenced_agents: 
        if agent.stubborn < 6 and agent.bias_ideology != media_ideology and agent.education <18:
          agent.ideology = media_ideology
          if influence_type == "propaganda":
            propaganda_count_this_step +=1
          else:
            influence_count_this_step += 1

      if influence_type == "propaganda" and propaganda_count_this_step > 0:
        self.propaganda_influence_counter += 1
        self.propaganda_influence_count += propaganda_count_this_step
        self.media_influence_events += (
            f"Propaganda influenced agents {self.propaganda_influence_counter} times. "
            f"Affected {self.propaganda_influence_count} agents in total.\n"
        )
      elif influence_count_this_step > 0:
        self.media_influence_counter += 1
        self.media_influence_count += influence_count_this_step
        self.media_influence_events += (
            f"Media influenced agents {self.media_influence_counter} times. "
            f"Affected {self.media_influence_count} agents in total.\n"
        )

    for _ in range(new_agent_count): #create newborns
      new_agent = MyAgent(None,self,"neutral",0,age=0)
      self.schedule.add(new_agent)
      self.social_network.add_node(new_agent.unique_id, pos=(random.random()*10,random.random()*10))

    agent_positions_list = [] 
    for agent in self.schedule.agents.values():
      x,y = self.social_network.nodes[agent.unique_id].get("pos", (random.random()*10, random.random()*10))
      agent_positions_list.append((x,y))  
      
    if len(self.agent_positions) > 0:
      self.kdtree = cKDTree(self.agent_positions)
    
    self.schedule.step()  
    self.update_spatial_data()
    self.avg_age = sum([agent.age for agent in self.schedule.agents.values()]) / len(self.schedule.agents) if self.schedule.agents else 0
    self.datacollector.collect(self)

  def count_type(self, ideology):
    return sum(1 for agent in self.schedule.agents.values() if agent.ideology == ideology)

def visualise_agents(model, step, ax):
  ax.cla()
  position_dict = nx.get_node_attributes(model.social_network, 'pos')
  missing_nodes = [node for node in model.social_network.nodes if node not in position_dict]
  if missing_nodes:
    print(f"Missing positions for nodes: {missing_nodes}")
    for node in missing_nodes:
      position_dict[node] = (0, 0) 

  for agent in model.schedule.agents.values():
    color = "gray"
    if agent.ideology == "conservative":
      color = "red"
    elif agent.ideology == "liberal":
      color = "blue"
    marker = 'o'  # Default marker
    if agent.stubborn > 6:
      marker = 's'
    elif agent.bias_ideology:
      marker = '^'
    nx.draw_networkx_nodes(model.social_network, position_dict, nodelist=[agent.unique_id], node_color=color, node_size=50, node_shape=marker, ax=ax)
  nx.draw_networkx_edges(model.social_network, pos=position_dict, edgelist=model.social_network.edges(), alpha=0.8, width=0.5, ax=ax)
  ax.set_xlim(-0.1, 10.1)
  ax.set_ylim(-0.1, 10.1)
    
  # Annotations for ideology counts and average age
  liberal_count = model.count_type("liberal")
  conservative_count = model.count_type("conservative")
  neutral_count = model.count_type("neutral")
  avg_neighbor_count = nx.average_neighbor_degree(model.social_network)
  avg_neighbor_count_value = sum(avg_neighbor_count.values()) / len(avg_neighbor_count) if avg_neighbor_count else 0
  ax.set_title(f"simulation step {step}")

  annotations = [
    f"Liberals: {liberal_count}",
    f"Conservatives: {conservative_count}",
    f"Neutrals: {neutral_count}",
    f"Avg. Age: {model.avg_age:.1f}",
    f"Avg Neighbors: {avg_neighbor_count_value:.1f}",
    model.media_influence_events,
    "Triangle: Bias",
    "Circle: No Bias",
    "Square: Stubborn"
  ]
  y_pos = 0.95  # Start annotation position
  for annotation in annotations:
    ax.text(0.02, y_pos, annotation, transform=ax.transAxes, fontsize=10, verticalalignment='top', bbox=dict(facecolor='white', alpha=0.8))
    y_pos -= 0.04
  return ax

def run_simulation(N: int, steps: int) -> dict:
    model = IdeologyModel(N=N)

    ideology_counts = {"liberal": [], "conservative": [], "neutral": []}
    stubborn_ratios = []

    for step in range(steps):
      model.step()

      ideology_counts["liberal"].append(model.count_type("liberal"))
      ideology_counts["conservative"].append(model.count_type("conservative"))
      ideology_counts["neutral"].append(model.count_type("neutral"))

      total_agents = model.schedule.get_agent_count()
      stubborn_agents = sum(
          1 for agent in model.schedule.agents.values() if agent.stubborn > 5
      )
      ratio = (stubborn_agents / total_agents) if total_agents else 0
      stubborn_ratios.append(ratio)

    # --- NEW: Extract network graph data ---
    network_nodes = []
    # Iterate through all nodes in the social network
    for agent_id, data in model.social_network.nodes(data=True):
        agent = model.schedule.agents.get(agent_id)
        if agent: # Ensure the agent still exists in the schedule
            node_data = {
                "id": str(agent_id), # Convert ID to string for frontend compatibility
                "type": agent.ideology, # Use agent's ideology for node coloring
            }
            # Include position data if available (from networkx node attributes)
            if 'pos' in data:
                node_data['x'] = data['pos'][0]
                node_data['y'] = data['pos'][1]
            network_nodes.append(node_data)

    network_links = []
    # Iterate through all edges in the social network
    for u, v in model.social_network.edges():
        network_links.append({
            "source": str(u), # Convert source ID to string
            "target": str(v)  # Convert target ID to string
        })

    model_data_df = model.datacollector.get_model_vars_dataframe()
    model_timeseries = []
    if model_data_df is not None and not model_data_df.empty:
      model_data_df = model_data_df.reset_index()
      step_col = "index" if "index" in model_data_df.columns else "Step"
      model_data_df = model_data_df.rename(columns={
          step_col: "step",
          "Liberal Count": "liberal",
          "Conservative Count": "conservative",
          "Neutral Count": "neutral",
          "Average Age": "average_age"
      })
      if "step" in model_data_df:
        model_data_df["step"] = model_data_df["step"].astype(int) + 1
      model_timeseries = json.loads(model_data_df.to_json(orient="records"))

    agent_data_df = model.datacollector.get_agent_vars_dataframe()
    agent_snapshots = []
    if agent_data_df is not None and not agent_data_df.empty:
      agent_data_df = agent_data_df.reset_index()
      agent_data_df = agent_data_df.rename(columns={
          "Step": "step",
          "AgentID": "agent_id",
          "Ideology": "ideology",
          "Stubbornness": "stubbornness",
          "Age": "age"
      })
      if "step" in agent_data_df:
        agent_data_df["step"] = agent_data_df["step"].astype(int) + 1
      agent_snapshots = json.loads(agent_data_df[["step", "agent_id", "ideology", "stubbornness", "age"]].to_json(orient="records"))
    
    result = {
      "counts": ideology_counts,
      "stubborn_ratios": stubborn_ratios,
      "average_age": model.avg_age,
      "final_counts": {
        "liberal": model.count_type("liberal"),
        "conservative": model.count_type("conservative"),
        "neutral": model.count_type("neutral"),
      },
      "media_influence_summary": model.media_influence_events,
      "network_graph": { # NEW FIELD: Include the extracted network data
          "nodes": network_nodes,
          "links": network_links
      },
      "model_timeseries": model_timeseries,
      "agent_snapshots": agent_snapshots
    }

    return result


# if __name__ == "__main__":
#   model = IdeologyModel(N=200)
#   steps = 40
#   fig, ax = plt.subplots(figsize=(8, 8))
#   ideology_counts = {"liberal": [], "conservative": [], "neutral": []}
#   stubborn_ratios = []

#   def update_plot(step):
#     model.step()
#     visualise_agents(model, step + 1, ax)
#     ideology_counts["liberal"].append(model.count_type("liberal"))
#     ideology_counts["conservative"].append(model.count_type("conservative"))
#     ideology_counts["neutral"].append(model.count_type("neutral"))

#     total_agents = model.schedule.get_agent_count()
#     stubborn_agents = sum(1 for agent in model.schedule.agents.values() if agent.stubborn > 5) # Consider agents with stubbornness > 5 as "stubborn"
#     stubborn_ratio = (stubborn_agents / total_agents) if total_agents else 0  # Avoid division by zero
#     stubborn_ratios.append(stubborn_ratio)

#     return fig

#   agent_data = model.datacollector.get_agent_vars_dataframe()
#   model_data = model.datacollector.get_model_vars_dataframe()

#   # ... (any analysis you want to perform on agent_data and model_data)

#   liberal_count = model.count_type("liberal")
#   conservative_count = model.count_type("conservative")
#   neutral_count = model.count_type("neutral")
#   print(f"Liberal: {liberal_count}, Conservative: {conservative_count}, Neutral: {neutral_count}")
