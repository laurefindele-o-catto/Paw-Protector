# RAG Context Injection Upgrade

## Overview
To ensure personalized care and streamline the agent's workflow, we have upgraded the `rag_search` tool to transparently inject User and Pet profile data alongside vector search results.

## Changes Implemented

### 1. Enhanced `rag_search` Tool (`backend/src/rag/tools.js`)
**Old Behavior:**
- Returned only `sources` (list of documents).
- Agent had to call `get_pet_card` separately to know the pet's name, age, or weight.

**New Behavior:**
- Automatically fetches **User Profile** (Name, Email, Phone) from DB.
- Automatically fetches **Pet Profile** (Name, Species, Breed, Age, Weight, Notes) from DB using `pet_id`.
- Calculates Pet Age (e.g., "3 years" or "5 months") from birthdate on the fly.
- Returns a structured JSON:
  ```json
  {
    "context_data": {
      "user": { "full_name": "...", "email": "..." },
      "pet": { "name": "Luna", "species": "Cat", "calculated_age": "2 years", ... }
    },
    "sources": [ ...docs... ]
  }
  ```

### 2. Optimized Agent Workflow (`backend/src/rag/agentGraph.js`)
- Updated **STAGE 1** prompt.
- Removed the mandatory step "Call get_pet_card first".
- Agent now receives all necessary context (Symptoms + Medical Docs + Pet Profile) in a single tool call (`rag_search`).

### 3. Vet Suggestions
- Validated `find_nearby_vets` tool.
- It calculates distance using the Haversine formula (`6371 * acos(...)`).
- Returns `distance_km` for each vet, ensuring recommendations are spatially relevant.

## Benefit
The Agent can now immediately correlate symptoms with the pet's specific biology (e.g., "Since Luna is an older cat..." or "For a 3-month-old puppy...") without improved latency or extra round-trips.
