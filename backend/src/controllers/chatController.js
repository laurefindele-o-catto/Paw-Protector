const ChatModel = require('../models/chatModel.js');
const { upsertDocs, search } = require('../rag/service.js');
const { getAgent } = require('../rag/agentGraph.js');

class ChatController {
    constructor() {
        this.model = new ChatModel();
    }

    createSession = async (req, res) => {
        try {
            const user_id = req.user.id;
            const { pet_id, title } = req.body;
            const session = await this.model.createSession({ user_id, pet_id, title });
            if (!session || session.success === false) {
                return res.status(500).json({ success: false, error: 'Failed to create chat session' });
            }
            return res.status(201).json({ success: true, session });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

    updateSessionTitle = async (req, res) => {
        try {
            const { session_id: sidParam } = req.params;
            const session_id = Number(sidParam);
            if (!Number.isInteger(session_id)) return res.status(400).json({ success: false, error: 'Invalid session_id' });
            const { title } = req.body;
            if (!title) return res.status(400).json({ success: false, error: 'Title required' });
            const updated = await this.model.updateSessionTitle(session_id, title);
            if (!updated || updated.success === false) {
                return res.status(500).json({ success: false, error: 'Failed to update session title' });
            }
            return res.status(200).json({ success: true, session: updated });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

    addMessage = async (req, res) => {
        try {
            const { session_id, sender, content, attachments } = req.body;
            if (!session_id || !sender || !content) {
                return res.status(400).json({ success: false, error: 'session_id, sender, content required' });
            }
            const message = await this.model.addMessage({ session_id, sender, content, attachments });
            if (!message || message.success === false) {
                return res.status(500).json({ success: false, error: 'Failed to add message' });
            }
            return res.status(201).json({ success: true, message });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

    getMessages = async (req, res) => {
        try {
            const { session_id: sidParam } = req.params;
            const session_id = Number(sidParam);
            if (!Number.isInteger(session_id)) return res.status(400).json({ success: false, error: 'Invalid session_id' });
            const messages = await this.model.getMessages(session_id);
            return res.status(200).json({ success: true, messages });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

    addRagSource = async (req, res) => {
        try {
            const data = req.body;
            if (!data.title) return res.status(400).json({ success: false, error: 'Title required' });
            const source = await this.model.addRagSource(data);
            if (!source || source.success === false) {
                return res.status(500).json({ success: false, error: 'Failed to add RAG source' });
            }
            return res.status(201).json({ success: true, source });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

    addVisionEvidence = async (req, res) => {
        try {
            const userId = req.user?.id;
            const { session_id: sidRaw, pet_id, label, detail, source } = req.body || {};
            const session_id = Number(sidRaw);
            if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
            if (!Number.isInteger(session_id)) return res.status(400).json({ success: false, error: 'Invalid session_id' });
            if (!label) return res.status(400).json({ success: false, error: 'label required' });

            
            const sysContent = `Image analysis result: ${label}${detail ? ` — ${detail}` : ''}`;
            const sysMsg = await this.model.addMessage({
                session_id,
                sender: 'system',
                content: sysContent,
                attachments: source ? { source } : null
            });

            await upsertDocs([{
                doc_id: `vision:${session_id}:msg:${sysMsg?.id || Date.now()}`,
                user_id: userId,
                pet_id: pet_id ?? null,
                doc_type: 'vision',
                content: `Vision finding: ${label}${detail ? `. Detail: ${detail}` : ''}`,
                metadata: { session_id, source: source || null }
            }]);

            return res.status(201).json({ success: true, message: sysMsg || { content: sysContent } });
        } catch (e) {
            return res.status(500).json({ success: false, error: e.message });
        }
    }

    ragUpsert = async (req, res) => {
        try {
            const userId = req.user?.id || req.body.user_id; 
            if (!userId) return res.status(400).json({ success: false, error: 'user_id required (from auth or body)' });

            const body = req.body || {};
            const docs = Array.isArray(body.docs) ? body.docs : [body];

            const normalized = docs.map(d => ({
                doc_id: d.doc_id || `adhoc:${Date.now()}:${Math.random().toString(36).slice(2,8)}`,
                user_id: userId,
                pet_id: d.pet_id ?? null,
                doc_type: d.doc_type || 'adhoc',
                content: d.content || '',
                metadata: d.metadata || {}
            }));

            const result = await upsertDocs(normalized);
            return res.status(201).json({ success: true, inserted: result.inserted, docs: normalized.map(x => x.doc_id) });
        } catch (e) {
            return res.status(500).json({ success: false, error: e.message });
        }
    };

    ragSearch = async (req, res) => {
        try {
            const userId = req.user?.id || Number(req.query.user_id);
            const { q, pet_id, topK, doc_types } = req.query;
            if (!userId) return res.status(400).json({ success: false, error: 'user_id required (auth or query)' });
            if (!q) return res.status(400).json({ success: false, error: 'q is required' });

            const parsedDocTypes = typeof doc_types === 'string' ? doc_types.split(',').map(s => s.trim()).filter(Boolean) : [];
            const out = await search({
                user_id: userId,
                query: q,
                topK: topK ? Number(topK) : 6,
                pet_id: pet_id != null ? Number(pet_id) : null,
                doc_types: parsedDocTypes
            });

            return res.json({ success: true, count: out.results.length, results: out.results });
        } catch (e) {
            return res.status(500).json({ success: false, error: e.message });
        }
    };

    chatAgentMessage = async (req, res) => {
        try {
            const userId = req.user?.id;
            const { session_id: sidRaw, content, pet_id, doc_types, topK, lat, lng } = req.body || {};
            if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
            if (!content) return res.status(400).json({ success: false, error: 'content required' });

            const agent = getAgent();
            const threadKey = sidRaw || `user-${userId}`;
            const configurable = {
                thread_id: threadKey,
                user_id: userId,
                pet_id: pet_id ? Number(pet_id) : null,
                lat: lat != null ? Number(lat) : null,
                lng: lng != null ? Number(lng) : null,
                
                doc_types: doc_types || 'pet_summary,metric,disease,vaccination,deworming,vision,chat',
                topK: topK ? Number(topK) : 6
            };

            const hint = `Context: pet_id=${configurable.pet_id ?? '—'}, doc_types=${configurable.doc_types}, topK=${configurable.topK}, lat=${configurable.lat ?? '—'}, lng=${configurable.lng ?? '—'}`;
            const result = await agent.invoke(
                { messages: [{ role: 'user', content: `${hint}\n\n${content}` }] },
                { configurable }
            );
            const answer = String(result?.messages?.at?.(-1)?.content || '').trim();

            let savedUser = null, savedAssistant = null;
            const session_id = Number(sidRaw);
            const canSave = Number.isInteger(session_id);
            if (canSave) {
                try {
                    savedUser = await this.model.addMessage({ session_id, sender: 'user', content, attachments: null });
                    savedAssistant = await this.model.addMessage({ session_id, sender: 'assistant', content: answer, attachments: null });
                } catch (_) {}
            }

            try {
                const docs = [];
                if (savedUser?.id) {
                    docs.push({
                        doc_id: `chat:${session_id}:msg:${savedUser.id}`,
                        user_id: userId,
                        pet_id: configurable.pet_id,
                        doc_type: 'chat',
                        content: `User: ${content}`,
                        metadata: { session_id, sender: 'user' }
                    });
                }
                if (savedAssistant?.id) {
                    docs.push({
                        doc_id: `chat:${session_id}:msg:${savedAssistant.id}`,
                        user_id: userId,
                        pet_id: configurable.pet_id,
                        doc_type: 'chat',
                        content: `Assistant: ${answer}`,
                        metadata: { session_id, sender: 'assistant' }
                    });
                }
                if (docs.length) await upsertDocs(docs);
            } catch (_) {}

            return res.status(200).json({ success: true, answer });
        } catch (e) {
            return res.status(500).json({ success: false, error: e.message });
        }
    }
}

module.exports = ChatController;