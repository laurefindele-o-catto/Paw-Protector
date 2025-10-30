const DB_Connection = require('../database/db.js');

class ChatModel {
    constructor() {
        this.db = new DB_Connection();
    }

    // Create chat session
    createSession = async ({ user_id, pet_id, title }) => {
        try {
            const query = `
                INSERT INTO chat_sessions (user_id, pet_id, title)
                VALUES ($1, $2, $3)
                RETURNING *;
            `;
            const params = [user_id, pet_id, title || 'Chat Session'];
            const result = await this.db.query_executor(query, params);
            return result.rows[0];
        } catch (error) {
            console.log(`Chat session insert failed: ${error.message}`);
            return { success: false };
        }
    };

    // Change chat session title
    updateSessionTitle = async (session_id, title) => {
        try {
            const query = `
                UPDATE chat_sessions
                SET title = $1, updated_at = NOW()
                WHERE id = $2
                RETURNING *;
            `;
            const result = await this.db.query_executor(query, [title, session_id]);
            return result.rows[0];
        } catch (error) {
            console.log(`Update session title failed: ${error.message}`);
            return { success: false };
        }
    };

    // Add chat message
    addMessage = async ({ session_id, sender, content, attachments }) => {
        try {
            const query = `
                INSERT INTO chat_messages (session_id, sender, content, attachments)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;
            const params = [session_id, sender, content, attachments || null];
            const result = await this.db.query_executor(query, params);
            return result.rows[0];
        } catch (error) {
            console.log(`Chat message insert failed: ${error.message}`);
            return { success: false };
        }
    };

    // Get messages for a session
    getMessages = async (session_id) => {
        try {
            const query = `
                SELECT * FROM chat_messages
                WHERE session_id = $1
                ORDER BY created_at ASC;
            `;
            const result = await this.db.query_executor(query, [session_id]);
            return result.rows;
        } catch (error) {
            console.log(`Get messages failed: ${error.message}`);
            return [];
        }
    };

    // Create RAG source
    addRagSource = async (data) => {
        try {
            const {
                title, uri, doc_type, locale, checksum,
                qdrant_collection, qdrant_point_id, metadata
            } = data;
            const query = `
                INSERT INTO rag_sources (
                    title, uri, doc_type, locale, checksum,
                    qdrant_collection, qdrant_point_id, metadata
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8
                )
                RETURNING *;
            `;
            const params = [title, uri, doc_type, locale, checksum, qdrant_collection, qdrant_point_id, metadata];
            const result = await this.db.query_executor(query, params);
            return result.rows[0];
        } catch (error) {
            console.log(`RAG source insert failed: ${error.message}`);
            return { success: false };
        }
    };
}

module.exports = ChatModel;