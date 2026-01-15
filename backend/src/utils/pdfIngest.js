const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const { v4: uuidv4 } = require('uuid');

function normalizeText(raw = '') {
    return raw
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/ +/g, ' ')
        .trim();
}

function cleanMetadata(meta = {}) {
    return Object.fromEntries(
        Object.entries(meta).filter(([, value]) => value !== undefined && value !== null)
    );
}

async function parsePdfToDocs(filePath, options = {}) {
    const {
        userId = 0,
        petId = null,
        docType = 'pdf_doc',
        metadata = {},
        chunkSize = 1000,
        chunkOverlap = 100
    } = options;

    const buffer = await fs.readFile(filePath);
    const pdfData = await pdfParse(buffer);
    const normalized = normalizeText(pdfData.text || '');

    if (!normalized) return [];

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize,
        chunkOverlap,
        separators: ['\n\n', '\n', '. ', ' ']
    });

    const chunks = await splitter.splitText(normalized);
    const enrichedMeta = cleanMetadata({
        ...metadata,
        page_count: pdfData.numpages,
        pdf_title: pdfData.info?.Title,
        pdf_author: pdfData.info?.Author
    });

    return chunks.map((chunk, index) => ({
        doc_id: `${docType}_${uuidv4().slice(0, 8)}_${index + 1}`,
        user_id: userId,
        pet_id: petId,
        doc_type: docType,
        content: chunk.trim(),
        metadata: {
            ...enrichedMeta,
            chunk_index: index
        }
    }));
}

module.exports = { parsePdfToDocs };
