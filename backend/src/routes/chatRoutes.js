const express = require('express');
const ChatController = require('../controllers/chatController.js');
const AuthenticateToken = require('../middlewares/authenticateToken.js');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

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

// Agentic chat (LangGraph ReAct) - supports text + optional image (field: "file")
router.post(
  '/chat/agent',
  authenticateToken.authenticateToken,
  upload.single('file'),
  chatController.chatAgentMessage
);

// Vision evidence 
router.post('/chat/vision', authenticateToken.authenticateToken, chatController.addVisionEvidence);

router.post('/rag/upsert', authenticateToken.authenticateToken, chatController.ragUpsert);
router.post('/rag/search', authenticateToken.authenticateToken, chatController.ragSearch)

module.exports = router;