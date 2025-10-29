const DB_Connection = require('../database/db.js');

class AnomalyModel {
    constructor() {
        this.db = new DB_Connection();
    }

    // Store uploaded image info
    addMediaAsset = async (data) => {
        try {
            const { owner_user_id, pet_id, url, content_type, width, height, taken_at, meta } = data;
            const query = `
                INSERT INTO media_assets (
                    owner_user_id, pet_id, url, content_type, width, height, taken_at, meta
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8
                )
                RETURNING *;
            `;
            const params = [owner_user_id, pet_id, url, content_type, width, height, taken_at, meta];
            const result = await this.db.query_executor(query, params);
            return result.rows[0];
        } catch (error) {
            console.log(`Media asset insert failed: ${error.message}`);
            return { success: false };
        }
    };

    // Create anomaly job
    addAnomalyJob = async (data) => {
        try {
            const { requester_user_id, pet_id, media_id, status, model_name } = data;
            const query = `
                INSERT INTO anomaly_jobs (
                    requester_user_id, pet_id, media_id, status, model_name
                ) VALUES (
                    $1, $2, $3, $4, $5
                )
                RETURNING *;
            `;
            const params = [requester_user_id, pet_id, media_id, status || 'queued', model_name];
            const result = await this.db.query_executor(query, params);
            return result.rows[0];
        } catch (error) {
            console.log(`Anomaly job insert failed: ${error.message}`);
            return { success: false };
        }
    };

    // Store anomaly result
    addAnomalyResult = async (data) => {
        try {
            const { job_id, label, confidence, bbox, advice } = data;
            const query = `
                INSERT INTO anomaly_results (
                    job_id, label, confidence, bbox, advice
                ) VALUES (
                    $1, $2, $3, $4, $5
                )
                RETURNING *;
            `;
            const params = [job_id, label, confidence, bbox, advice];
            const result = await this.db.query_executor(query, params);
            return result.rows[0];
        } catch (error) {
            console.log(`Anomaly result insert failed: ${error.message}`);
            return { success: false };
        }
    };
}

module.exports = AnomalyModel;