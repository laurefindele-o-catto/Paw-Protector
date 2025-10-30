const express = require('express');
const ChatController = require('../controllers/chatController.js');
const AuthenticateToken = require('../middlewares/authenticateToken.js'); // fixed

const router = express.Router();
const chatController = new ChatController();
const authenticateToken = new AuthenticateToken();

// Create chat session
router.post('/chat/session', authenticateToken.authenticateToken, chatController.createSession);

// Update chat session title
router.patch('/chat/session/:session_id/title', authenticateToken.authenticateToken, chatController.updateSessionTitle);

// Add chat message
router.post('/chat/message', authenticateToken.authenticateToken, chatController.addMessage);

// Get messages for a session
router.get('/chat/session/:session_id/messages', authenticateToken.authenticateToken, chatController.getMessages);

// Add RAG source
router.post('/chat/rag-source', authenticateToken.authenticateToken, chatController.addRagSource);

module.exports = router;