const express = require('express');
const KnowledgeBaseController = require('../controllers/knowledgeBaseController.js');

const router = express.Router();
const knowledgeBaseController = new KnowledgeBaseController();

/**
 * @openapi
 * /api/knowledge-base/import:
 *   post:
 *     tags: [Knowledge Base]
 *     summary: Import veterinary knowledge base into vector database
 *     description: Parses the structured markdown file and embeds all chunks into the vector database for RAG retrieval
 *     responses:
 *       200:
 *         description: Knowledge base imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 inserted:
 *                   type: number
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     total_chunks:
 *                       type: number
 *                     by_doc_type:
 *                       type: object
 *                     by_category:
 *                       type: object
 *                     by_severity:
 *                       type: object
 *                     by_species:
 *                       type: object
 *       400:
 *         description: No documents found in knowledge base
 *       500:
 *         description: Import failed
 */
router.post('/import', knowledgeBaseController.importKnowledgeBase);

/**
 * @openapi
 * /api/knowledge-base/stats:
 *   get:
 *     tags: [Knowledge Base]
 *     summary: Get statistics about the knowledge base file
 *     description: Returns statistics about what will be imported (does not actually import)
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       500:
 *         description: Failed to get statistics
 */
router.get('/stats', knowledgeBaseController.getKnowledgeBaseStats);

/**
 * @openapi
 * /api/knowledge-base/reimport:
 *   post:
 *     tags: [Knowledge Base]
 *     summary: Re-import knowledge base (fresh import)
 *     description: Clears old knowledge base entries and imports fresh data
 *     responses:
 *       200:
 *         description: Knowledge base re-imported successfully
 *       500:
 *         description: Re-import failed
 */
router.post('/reimport', knowledgeBaseController.reimportKnowledgeBase);

module.exports = router;
