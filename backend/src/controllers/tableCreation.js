const TableCreation = require('../models/tableCreation.js')

class CreateTables {
    constructor() {
        this.tables = new TableCreation()
    }
    
    createTables = async(req, res)=>{
        try {
            // Base auth tables
            await this.tables.create_users_table();
            // Helper migration for existing tables (safe to run)
            await this.tables.migrate_users_table_whatsapp();

            await this.tables.create_roles_table();
            await this.tables.create_user_roles_table();
            await this.tables.create_user_location_table(); 

            // Clinics first (FK for many tables)
            await this.tables.create_vet_clinics_table();

            // Pets next (FK for many tables)
            await this.tables.create_pets_table();

            // Vector + RAG tables (after users/pets exist for FK)
            await this.tables.ensure_pgvector_and_rag_documents();

            // Vet profiles (depends on users + clinics)
            await this.tables.create_vets_table();

            // Pet-related logs (depend on pets, sometimes clinics/users)
            await this.tables.create_pet_health_metrics_table();
            await this.tables.create_vaccinations_table();
            await this.tables.create_dewormings_table();
            await this.tables.create_appointments_table();     // depends on pets + users + vet_clinics
            await this.tables.create_vet_reviews_table();      // depends on users + vet_clinics
            await this.tables.create_emergency_requests_table(); // depends on pets + users + vet_clinics
            await this.tables.create_pet_diseases_table();

            // Media + anomaly (depend on users/pets, then media, then jobs)
            await this.tables.create_media_assets_table();     
            await this.tables.create_anomaly_jobs_table();     
            await this.tables.create_anomaly_results_table();  

            // Reminders/notifications (depend on users/pets)
            await this.tables.create_reminder_schedules_table();
            await this.tables.create_notifications_table();

            // Chat (sessions before messages)
            await this.tables.create_chat_sessions_table();
            await this.tables.create_chat_messages_table();

            // RAG sources (no deps)
            await this.tables.create_rag_sources_table();

            res.status(201).json({
                success: true,
                message: "All tables created"
            });
        } catch (error) {
            console.error("Failed to create tables: " + error.message);
            res.status(500).json({ success:false, error: error.message });
        }
    }

    create_request_table = async (req, res) => {
        try {
            const result = await this.tables.create_request_table();
            res.json(result);
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    create_vet_approve_table = async (req, res) => {
        try {
            const result = await this.tables.create_vet_approve_table();
            res.json(result);
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = CreateTables;