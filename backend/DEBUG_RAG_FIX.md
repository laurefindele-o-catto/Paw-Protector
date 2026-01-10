# RAG Fix: User Data Retrieval

## Incident Report
**Issue:** Search results were exclusively returning Knowledge Base info (`user_id: '0'`), ignoring User/Pet data even when available.
**Root Cause:** The similarity search was performing a single vector query. Since Knowledge Base articles often have better structured text and higher semantic similarity scores than raw user logs, the top N results were entirely populated by KB docs before the 40/60 allocation logic could even run.

## The Fix
Implemented a **Dual-Query Strategy** in `backend/src/rag/vectorStore.js`.

### Old Logic (Single Query)
```sql
SELECT * FROM documents 
WHERE (user_id = $userId OR user_id = '0') 
ORDER BY similarity DESC 
LIMIT 20
-- Result: 20 KB docs (if they score higher)
-- Filter: User docs = 0 found
```

### New Logic (Dual Query)
We now execute two parallel optimized queries:

**Query 1: User Data**
```sql
SELECT * FROM documents 
WHERE user_id = $userId 
AND (pet_id IS NULL OR pet_id = $petId)
LIMIT 6
```

**Query 2: Knowledge Base**
```sql
SELECT * FROM documents 
WHERE user_id = '0' 
LIMIT 6
```

### Merging Strategy
We combine results in memory to guarantee the ratio:
1. **First:** Take top 3-4 User Docs (guaranteed presence if they exist)
2. **Second:** Take top 2-3 KB Docs
3. **Third:** Backfill remaining slots with best available matches

This ensures the Agent **always** receives context about the specific pet first, followed by relevant veterinary guidelines.
