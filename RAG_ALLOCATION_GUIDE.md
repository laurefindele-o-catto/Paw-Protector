# RAG Document Allocation Guide

## 📊 Current Strategy: 40% Knowledge Base / 60% User Data

### Allocation Logic

```javascript
For topK = 6:
├─ If user has pet-related docs:
│  ├─ Knowledge Base: 2-3 docs (40%)
│  └─ User/Pet Data: 3-4 docs (60%)
│
└─ If NO pet-related docs:
   └─ Knowledge Base: 6 docs (100%)
```

### Examples

#### Example 1: User with Pet History
**Query:** "আমার বিড়াল বমি করছে"  
**topK:** 6  
**Result Distribution:**
- 🟦 **4 User Docs** (60%): Pet health records, past vet visits, medication history, diet logs
- 🟩 **2 KB Docs** (40%): First-aid for vomiting, disease guide for gastrointestinal issues

**Why this works:**
- Prioritizes specific pet context (Luna's history, breed tendencies, past issues)
- Still provides veterinary guidelines for proper diagnosis
- Agent can correlate "Luna had similar symptoms 2 months ago" with "According to veterinary guidelines..."

---

#### Example 2: New User with No Pet Data
**Query:** "My dog is limping"  
**topK:** 6  
**Result Distribution:**
- 🟦 **0 User Docs**: No pet registered yet
- 🟩 **6 KB Docs** (100%): First-aid for limping, bone/joint issues, common injuries, when to see vet

**Why this works:**
- Falls back to pure knowledge base guidance
- Still provides helpful veterinary information
- Encourages user to register pet for personalized care

---

## 🔧 Adjusting the Ratio

If you want different allocation (e.g., 30/70 or 50/50), edit [vectorStore.js](backend/src/rag/vectorStore.js):

```javascript
// Line ~86
const kbSlots = Math.ceil(topK * 0.4); // Change 0.4 to desired KB percentage
const userSlots = topK - kbSlots;
```

### Suggested Ratios by Use Case

| Use Case | KB % | User % | Reasoning |
|----------|------|--------|-----------|
| **Medical Diagnosis** | 40% | 60% | ✅ Current - balances guidelines with pet history |
| **General Pet Care** | 30% | 70% | More focus on user's specific pet needs |
| **Emergency Triage** | 50% | 50% | Equal weight to protocols and pet condition |
| **New User Onboarding** | 100% | 0% | Fallback when no pet data exists |

---

## 📈 Monitoring Performance

### How to Verify Allocation

1. **Check backend logs** during chat:
   ```bash
   # Look for ragSearchTool output in console
   # Shows: user_specific_count and knowledge_base_count
   ```

2. **Test queries:**
   ```javascript
   // Should show ~40/60 split
   {
     total_count: 6,
     user_specific_count: 4,
     knowledge_base_count: 2
   }
   ```

3. **Database query:**
   ```sql
   -- Check KB doc count
   SELECT COUNT(*) FROM rag_documents_lc 
   WHERE (metadata->>'user_id') = '0';
   
   -- Check user doc count for a pet
   SELECT COUNT(*) FROM rag_documents_lc 
   WHERE (metadata->>'user_id') = 'USER_ID' 
   AND (metadata->>'pet_id') = 'PET_ID';
   ```

---

## 🐛 Troubleshooting

### Issue: Getting 3 KB docs instead of 2
**Cause:** `Math.ceil(6 * 0.4) = 3` rounds up  
**Fix:** Change to `Math.floor` or `Math.round` if you want exactly 2

### Issue: Still getting 50/50 split
**Check:**
1. Backend restarted? (agent caches system prompt)
2. Files saved correctly?
3. Run: `node backend/src/index.js` and check logs

### Issue: No user docs appearing
**Check:**
1. Pet registered? `SELECT * FROM pets WHERE id = PET_ID;`
2. Chat history indexed? `SELECT COUNT(*) FROM rag_documents_lc WHERE doc_type='chat';`
3. Try manual search: `POST /api/chat/agent` with known pet_id

---

## 💡 Best Practices

1. **Monitor ratio in production:**
   - Add analytics to track KB vs User doc usage
   - Adjust based on user satisfaction metrics

2. **Consider context:**
   - New users: More KB content helpful for education
   - Power users: More personalized data preferred
   - Emergency queries: Balance both equally

3. **Keep KB updated:**
   - Regularly add new disease guides
   - Update first-aid protocols
   - Import: `POST /api/knowledge-base/import`

4. **Test edge cases:**
   - User with 1 pet doc vs 100 pet docs
   - Multi-pet households
   - Rare breed-specific conditions

---

**Last Updated:** January 10, 2026  
**Current Allocation:** 40% KB / 60% User  
**Configurable:** Yes (via vectorStore.js)
