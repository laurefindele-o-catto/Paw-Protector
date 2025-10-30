const ChatModel = require('../models/chatModel.js');

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
            const { session_id } = req.params;
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
            const { session_id } = req.params;
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
}

module.exports = ChatController;