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
            const user_id = Number(id);
            const { name, clinic_id, license_number, license_issuer, license_valid_until, specialization, verified } = data;
            const expiry = license_valid_until ? new Date(license_valid_until) : null;
            const today = new Date();
            const _verified = expiry && expiry instanceof Date && !isNaN(expiry.getTime()) && expiry >= today ? !!verified : false;

            const query = `
                UPDATE vets
                SET
                  name = COALESCE($2, name),
                  clinic_id = COALESCE($3, clinic_id),
                  license_number = COALESCE($4, license_number),
                  license_issuer = COALESCE($5, license_issuer),
                  license_valid_until = COALESCE($6, license_valid_until),
                  specialization = COALESCE($7, specialization),
                  verified = $8
                WHERE user_id = $1
                RETURNING *;
            `;
            const params = [user_id, name || null, clinic_id || null, license_number || null, license_issuer || null, license_valid_until || null, specialization || null, _verified];
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

    autoVerifyVet = async (data) => {
        const { license_number, license_issuer, license_valid_until, name } = data;

        if (!name || !license_number || !license_issuer) return false;

        const today = new Date();
        const expiry = new Date(license_valid_until);
        if (isNaN(expiry.getTime()) || expiry < today) return false;

        const validIssuers = ["Bangladesh Veterinary Council", "RCVS", "State Vet Board"];
        if (!validIssuers.includes(license_issuer)) return false;

        return true;
    }

}

module.exports = ClinicVetModel;