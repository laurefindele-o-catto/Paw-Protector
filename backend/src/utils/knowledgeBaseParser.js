const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Parse the structured markdown knowledge base file and extract chunks
 * @param {string} filePath - Path to the structured markdown file
 * @returns {Promise<Array>} Array of parsed document chunks
 */
async function parseKnowledgeBase(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Handle both Unix (\n) and Windows (\r\n) line endings
        const sections = content.split(/(?:\r?\n)---(?:\r?\n)/).filter(s => s.trim());
        
        const parsedDocs = [];
        
        for (const section of sections) {
            const docTypeMatch = section.match(/## DOCUMENT TYPE:\s*(\w+)/);
            
            if (!docTypeMatch) {
                console.log('Skipping section - no DOCUMENT TYPE header');
                continue;
            }
            
            const categoryMatch = section.match(/## CATEGORY:\s*([\w_]+)/);
            const topicMatch = section.match(/## TOPIC:\s*(.+)/);
            
            if (!docTypeMatch || !categoryMatch || !topicMatch) {
                console.log('Skipping section - missing metadata');
                continue;
            }
            
            const docType = docTypeMatch[1].trim();
            const category = categoryMatch[1].trim();
            const topic = topicMatch[1].trim();
            
            const contentStartIndex = section.indexOf('###');
            if (contentStartIndex === -1) {
                console.log('Skipping section - no content found');
                continue;
            }
            
            const actualContent = section.substring(contentStartIndex).trim();
            
            const species = determineSpecies(actualContent);
            const severity = determineSeverity(actualContent, docType, category);
            
            parsedDocs.push({
                doc_id: `kb_${docType}_${category}_${uuidv4().substring(0, 8)}`,
                content: actualContent,
                doc_type: docType,
                metadata: {
                    category: category,
                    topic: topic,
                    species: species,
                    severity: severity,
                    source: 'veterinary_knowledge_base',
                    is_global: true
                }
            });
        }
        
        console.log(`Parsed ${parsedDocs.length} knowledge base chunks`);
        return parsedDocs;
        
    } catch (error) {
        console.error('Error parsing knowledge base:', error);
        throw error;
    }
}

/**
 * Determine which species the content applies to
 * @param {string} content - Document content
 * @returns {string} 'cat', 'dog', or 'both'
 */
function determineSpecies(content) {
    const lowerContent = content.toLowerCase();
    const hasCat = lowerContent.includes('cat') || lowerContent.includes('feline');
    const hasDog = lowerContent.includes('dog') || lowerContent.includes('canine');
    
    if (hasCat && !hasDog) return 'cat';
    if (hasDog && !hasCat) return 'dog';
    return 'both';
}

/**
 * Determine severity level based on content and metadata
 * @param {string} content - Document content
 * @param {string} docType - Document type
 * @param {string} category - Category
 * @returns {string} 'emergency', 'acute', 'chronic', or 'informational'
 */
function determineSeverity(content, docType, category) {
    const lowerContent = content.toLowerCase();
    
    if (docType === 'first_aid' || 
        lowerContent.includes('emergency') || 
        lowerContent.includes('immediately') ||
        lowerContent.includes('life-threatening') ||
        lowerContent.includes('critical') ||
        category.includes('emergency')) {
        return 'emergency';
    }
    
    if (lowerContent.includes('chronic') || 
        lowerContent.includes('long-term') ||
        lowerContent.includes('persistent')) {
        return 'chronic';
    }
    
    if (lowerContent.includes('acute') || 
        lowerContent.includes('sudden')) {
        return 'acute';
    }
    
    return 'informational';
}

/**
 * Parse and prepare knowledge base for database insertion with user context
 * @param {string} filePath - Path to the structured markdown file
 * @param {number} userId - User ID for the knowledge base (0 for global)
 * @returns {Promise<Array>} Array of documents ready for insertion
 */
async function prepareKnowledgeBaseForInsertion(filePath, userId = 0) {
    const parsedDocs = await parseKnowledgeBase(filePath);
    
    return parsedDocs.map(doc => ({
        doc_id: doc.doc_id,
        user_id: userId, 
        pet_id: null, 
        doc_type: doc.doc_type,
        content: doc.content,
        metadata: doc.metadata
    }));
}

module.exports = {
    parseKnowledgeBase,
    prepareKnowledgeBaseForInsertion,
    determineSpecies,
    determineSeverity
};
