/**
 * Test script to verify knowledge base parsing
 * Run with: node backend/src/utils/testKnowledgeBaseParser.js
 */

const path = require('path');
const { parseKnowledgeBase, prepareKnowledgeBaseForInsertion } = require('./knowledgeBaseParser.js');

async function test() {
    try {
        const filePath = path.join(__dirname, '../vector_embedding_file_structured.md');
        
        console.log('Testing knowledge base parser...');
        console.log('File path:', filePath);
        console.log('---\n');
        
        // Test parsing
        const docs = await prepareKnowledgeBaseForInsertion(filePath, 0);
        
        console.log(`✓ Successfully parsed ${docs.length} documents\n`);
        
        // Show statistics
        const stats = {
            by_doc_type: {},
            by_category: {},
            by_severity: {},
            by_species: {}
        };
        
        docs.forEach(doc => {
            stats.by_doc_type[doc.doc_type] = (stats.by_doc_type[doc.doc_type] || 0) + 1;
            stats.by_category[doc.metadata.category] = (stats.by_category[doc.metadata.category] || 0) + 1;
            stats.by_severity[doc.metadata.severity] = (stats.by_severity[doc.metadata.severity] || 0) + 1;
            stats.by_species[doc.metadata.species] = (stats.by_species[doc.metadata.species] || 0) + 1;
        });
        
        console.log('Statistics:');
        console.log('By Document Type:', stats.by_doc_type);
        console.log('By Category:', stats.by_category);
        console.log('By Severity:', stats.by_severity);
        console.log('By Species:', stats.by_species);
        console.log('\n---\n');
        
        // Show sample documents
        console.log('Sample Documents (first 3):');
        docs.slice(0, 3).forEach((doc, i) => {
            console.log(`\nDocument ${i + 1}:`);
            console.log('  doc_id:', doc.doc_id);
            console.log('  doc_type:', doc.doc_type);
            console.log('  user_id:', doc.user_id);
            console.log('  pet_id:', doc.pet_id);
            console.log('  metadata:', JSON.stringify(doc.metadata, null, 2));
            console.log('  content preview:', doc.content.substring(0, 150) + '...');
        });
        
        console.log('\n✓ Parser test completed successfully!');
        
    } catch (error) {
        console.error('✗ Parser test failed:', error);
        process.exit(1);
    }
}

test();
