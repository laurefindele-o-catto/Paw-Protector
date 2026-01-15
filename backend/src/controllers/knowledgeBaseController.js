const path = require('path');
const { prepareKnowledgeBaseForInsertion } = require('../utils/knowledgeBaseParser.js');
const { parsePdfToDocs } = require('../utils/pdfIngest.js');
const { upsertDocs } = require('../rag/service.js');

class KnowledgeBaseController {
    constructor() {
        this.knowledgeBasePath = path.join(__dirname, '../vector_embedding_file_structured.md');
        this.petCareGuidePath = path.join(__dirname, '../pet_care_guide.pdf');
    }

    buildStats = (docs = []) => {
        const stats = {
            total_chunks: docs.length,
            by_doc_type: {},
            by_category: {},
            by_severity: {},
            by_species: {}
        };

        docs.forEach((doc, index) => {
            stats.by_doc_type[doc.doc_type] = (stats.by_doc_type[doc.doc_type] || 0) + 1;

            const category = doc.metadata?.category || 'unknown';
            stats.by_category[category] = (stats.by_category[category] || 0) + 1;

            const severity = doc.metadata?.severity || 'unknown';
            stats.by_severity[severity] = (stats.by_severity[severity] || 0) + 1;

            const species = doc.metadata?.species || 'unknown';
            stats.by_species[species] = (stats.by_species[species] || 0) + 1;

            if (index < 10) {
                stats.sample_topics = stats.sample_topics || [];
                stats.sample_topics.push({
                    doc_type: doc.doc_type,
                    category,
                    topic: doc.metadata?.topic || 'unknown',
                    species,
                    severity,
                    content_preview: doc.content.substring(0, 150) + '...'
                });
            }
        });

        return stats;
    };

    /**
     * Import the entire veterinary knowledge base into the vector database
     * This endpoint embeds and indexes all knowledge base content
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    importKnowledgeBase = async (req, res) => {
        try {
            console.log('Starting knowledge base import...');
            console.log('File path:', this.knowledgeBasePath);
            
            const docs = await prepareKnowledgeBaseForInsertion(
                this.knowledgeBasePath,
                0 
            );
            
            if (docs.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No documents found in knowledge base file'
                });
            }
            
            console.log(`Parsed ${docs.length} knowledge base chunks`);
            
            const result = await upsertDocs(docs);
            
            const stats = this.buildStats(docs);
            
            return res.status(200).json({
                success: true,
                message: 'Knowledge base imported and embedded successfully',
                inserted: result.inserted,
                statistics: stats,
                sample_doc_ids: docs.slice(0, 5).map(d => d.doc_id)
            });
            
        } catch (error) {
            console.error('Knowledge base import error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to import knowledge base',
                details: error.message
            });
        }
    };

    /**
     * Get statistics about the current knowledge base content
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    getKnowledgeBaseStats = async (req, res) => {
        try {
            const docs = await prepareKnowledgeBaseForInsertion(
                this.knowledgeBasePath,
                0
            );
            
            const stats = this.buildStats(docs);
            
            return res.status(200).json({
                success: true,
                statistics: stats
            });
            
        } catch (error) {
            console.error('Error getting knowledge base stats:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to get knowledge base statistics',
                details: error.message
            });
        }
    };

    /**
     * Re-import knowledge base (clears old entries and imports fresh)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Promise<void>}
     */
    reimportKnowledgeBase = async (req, res) => {
        try {
            console.log('Starting knowledge base re-import...');
            
            // TODO: Add logic to delete old knowledge base entries (user_id = 0)
            
            const result = await this.importKnowledgeBase(req, res);
            return result;
            
        } catch (error) {
            console.error('Knowledge base re-import error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to re-import knowledge base',
                details: error.message
            });
        }
    };

    /**
     * Import pet care guide PDF into the vector database (global doc_type: care_guide)
     */
    importPetCareGuide = async (req, res) => {
        try {
            console.log('Starting pet care guide import...');
            console.log('File path:', this.petCareGuidePath);

            const docs = await parsePdfToDocs(this.petCareGuidePath, {
                userId: 0,
                petId: null,
                docType: 'care_guide',
                metadata: {
                    category: 'pet_care',
                    topic: 'general_pet_care',
                    audience: 'pet_owner',
                    source: 'pet_care_guide_pdf',
                    source_path: 'pet_care_guide.pdf',
                    is_global: true
                },
                chunkSize: 1200,
                chunkOverlap: 150
            });

            if (!docs.length) {
                return res.status(400).json({
                    success: false,
                    error: 'No content extracted from pet_care_guide.pdf'
                });
            }

            const result = await upsertDocs(docs);
            const stats = this.buildStats(docs);

            return res.status(200).json({
                success: true,
                message: 'Pet care guide embedded successfully',
                inserted: result.inserted,
                statistics: stats,
                sample_doc_ids: docs.slice(0, 5).map(d => d.doc_id)
            });
        } catch (error) {
            console.error('Pet care guide import error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to import pet care guide',
                details: error.message
            });
        }
    };
}

module.exports = KnowledgeBaseController;
