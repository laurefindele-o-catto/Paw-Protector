const express = require('express');
const ChatController = require('../controllers/chatController.js');
const AuthenticateToken = require('../middlewares/authenticateToken.js');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();
const chatController = new ChatController();
const authenticateToken = new AuthenticateToken();

/**
 * @openapi
 * /api/chat/session:
 *   post:
 *     tags: [Chat]
 *     summary: Create a new chat session
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Session created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatSession'
 */
router.post('/chat/session', authenticateToken.authenticateToken, chatController.createSession);

/**
 * @openapi
 * /api/chat/session/{session_id}/title:
 *   patch:
 *     tags: [Chat]
 *     summary: Update chat session title
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: 'string' }
 *     responses:
 *       200:
 *         description: Updated
 */
router.patch('/chat/session/:session_id/title', authenticateToken.authenticateToken, chatController.updateSessionTitle);

/**
 * @openapi
 * /api/chat/message:
 *   post:
 *     tags: [Chat]
 *     summary: Add a user/assistant message to a session
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatMessage'
 *     responses:
 *       201:
 *         description: Message saved
 */
router.post('/chat/message', authenticateToken.authenticateToken, chatController.addMessage);

/**
 * @openapi
 * /api/chat/session/{session_id}/messages:
 *   get:
 *     tags: [Chat]
 *     summary: List messages for a session
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Messages
 */
router.get('/chat/session/:session_id/messages', authenticateToken.authenticateToken, chatController.getMessages);

/**
 * @openapi
 * /api/chat/rag-source:
 *   post:
 *     tags: [RAG]
 *     summary: Add a RAG source document for chat
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RagUpsertRequest'
 *     responses:
 *       201:
 *         description: Upserted
 */
router.post('/chat/rag-source', authenticateToken.authenticateToken, chatController.addRagSource);

/**
 * @openapi
 * /api/chat/agent:
 *   post:
 *     tags: [Chat]
 *     summary: Agentic chat (supports text + optional image)
 *     description: Send message content and optional image file under field `file`.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content: { type: string }
 *               session_id: { type: string }
 *               pet_id: { type: integer }
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Agent response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AgentChatResponse'
 */
router.post(
  '/chat/agent',
  authenticateToken.authenticateToken,
  upload.single('file'),
  chatController.chatAgentMessage
);

/**
 * @openapi
 * /api/chat/vision:
 *   post:
 *     tags: [Chat]
 *     summary: Attach vision evidence to a chat context
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               session_id: { type: string }
 *               content: { type: string }
 *     responses:
 *       201:
 *         description: Saved
 */
router.post('/chat/vision', authenticateToken.authenticateToken, chatController.addVisionEvidence);

/**
 * @openapi
 * /api/rag/upsert:
 *   post:
 *     tags: [RAG]
 *     summary: Upsert document into vector store
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RagUpsertRequest'
 *     responses:
 *       201:
 *         description: Upserted
 */
router.post('/rag/upsert', authenticateToken.authenticateToken, chatController.ragUpsert);
/**
 * @openapi
 * /api/rag/search:
 *   post:
 *     tags: [RAG]
 *     summary: Semantic search over vector store
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query: { type: string }
 *               pet_id: { type: integer }
 *               limit: { type: integer, default: 5 }
 *     responses:
 *       200:
 *         description: Search results
 */
router.post('/rag/search', authenticateToken.authenticateToken, chatController.ragSearch)

module.exports = router;