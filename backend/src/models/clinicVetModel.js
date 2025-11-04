const DB_Connection = require('../database/db.js');

class ClinicVetModel {
    constructor() {
        this.db = new DB_Connection();
    }

    // Clinics
    createClinic = async (data) => {
        try {
            const { name, phone, email, address, latitude, longitude, hours, is_verified } = data;
            const query = `
                INSERT INTO vet_clinics (name, phone, email, address, latitude, longitude, hours, is_verified)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *;
            `;
            const params = [name, phone, email, address, latitude, longitude, hours, !!is_verified];
            const result = await this.db.query_executor(query, params);
            return result.rows[0];
        } catch (error) {
            console.log(`Clinic insert failed: ${error.message}`);
            return { success: false };
        }
    };

    // Vets
    createVet = async (data) => {
        try {
            const { user_id, name, clinic_id, license_number, license_issuer, license_valid_until, specialization, verified } = data;
            const query = `
                INSERT INTO vets (user_id, name, clinic_id, license_number, license_issuer, license_valid_until, specialization, verified)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *;
            `;
            const params = [user_id, name, clinic_id, license_number, license_issuer, license_valid_until, specialization, !!verified];
            const result = await this.db.query_executor(query, params);
            return result.rows[0];
        } catch (error) {
            console.log(`Vet insert failed: ${error.message}`);
            return { success: false };
        }
    };

    updateVet = async (id, data) => {
        try {
            const user_id = id;
            const { name, clinic_id, license_number, license_issuer, license_valid_until, specialization, verified } = data;
            const query = `
                UPDATE vets (user_id, name, clinic_id, license_number, license_issuer, license_valid_until, specialization, verified)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *;
            `;
            const params = [user_id, name, clinic_id, license_number, license_issuer, license_valid_until, specialization, !!verified];
            const result = await this.db.query_executor(query, params);
            return result.rows[0];
        } catch (error) {
            console.log(`Vet insert failed: ${error.message}`);
            return { success: false };
        }
    };

    // Reviews
    createReview = async (data) => {
        try {
            const { reviewer_user_id, vet_user_id, clinic_id, rating, title, body } = data;
            const query = `
                INSERT INTO vet_reviews (reviewer_user_id, vet_user_id, clinic_id, rating, title, body)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *;
            `;
            const params = [reviewer_user_id, vet_user_id, clinic_id, rating, title, body];
            const result = await this.db.query_executor(query, params);
            return result.rows[0];
        } catch (error) {
            console.log(`Review insert failed: ${error.message}`);
            return { success: false };
        }
    };

    // Appointments
    createAppointment = async (data) => {
        try {
            const { pet_id, owner_user_id, vet_user_id, clinic_id, starts_at, ends_at, status, reason } = data;
            const query = `
                INSERT INTO appointments (pet_id, owner_user_id, vet_user_id, clinic_id, starts_at, ends_at, status, reason)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *;
            `;
            const params = [pet_id, owner_user_id, vet_user_id, clinic_id, starts_at, ends_at, status, reason];
            const result = await this.db.query_executor(query, params);
            return result.rows[0];
        } catch (error) {
            console.log(`Appointment insert failed: ${error.message}`);
            return { success: false };
        }
    };
}

module.exports = ClinicVetModel;