const DB_Connection = require('../database/db.js')

class TableCreation {
    constructor(){
        this.db_connection = new DB_Connection();
    }

    enable_pgvector_extension = async () => {
        try {
            const query = `
                CREATE EXTENSION IF NOT EXISTS vector;
                CREATE EXTENSION IF NOT EXISTS pgcrypto;
            `;
            await this.db_connection.query_executor(query);
            console.log("pgvector extension ensured");
            return { success: true };
        } catch (error) {
            console.log(`Error enabling pgvector: ${error.message}`);
            throw error;
        }
    };

    create_rag_table_named = async(tableName = 'rag_documents') => {
        const dim = Number(process.env.EMBEDDING_DIM || 1536);
        const lists = Number(process.env.PGVECTOR_INDEX_LISTS || 100);

        const ddl = `
            CREATE TABLE IF NOT EXISTS ${tableName}(
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                doc_id TEXT UNIQUE,
                user_id TEXT,
                pet_id TEXT,
                doc_type VARCHAR(50),
                content TEXT,
                metadata JSONB,
                embedding vector(${dim}),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            -- Defensive migrations to align existing tables (do NOT force NOT NULL; existing data may have NULLs)
            ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS doc_id TEXT;
            ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS user_id TEXT;
            ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS pet_id TEXT;
            ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS doc_type VARCHAR(50);
            ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS content TEXT;
            ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS metadata JSONB;
            ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS embedding vector(${dim});
            ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
            ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

            -- Backfill doc_id from metadata for older rows (common when table was created by a vectorstore)
            UPDATE ${tableName}
            SET doc_id = COALESCE(doc_id, metadata->>'doc_id')
            WHERE doc_id IS NULL AND metadata ? 'doc_id';

            -- Uniqueness for upserts (allows multiple NULLs)
            CREATE UNIQUE INDEX IF NOT EXISTS ${tableName}_doc_id_key ON ${tableName}(doc_id);

            -- Filter/lookup indexes
            CREATE INDEX IF NOT EXISTS idx_${tableName}_user_id ON ${tableName}(user_id);
            CREATE INDEX IF NOT EXISTS idx_${tableName}_pet_id ON ${tableName}(pet_id);
            CREATE INDEX IF NOT EXISTS idx_${tableName}_doc_type ON ${tableName}(doc_type);
            CREATE INDEX IF NOT EXISTS idx_${tableName}_metadata_gin ON ${tableName} USING GIN (metadata);

            CREATE INDEX IF NOT EXISTS idx_${tableName}_embedding_ivfflat
            ON ${tableName} USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = ${lists});
        `;
        try {
            await this.db_connection.query_executor(ddl);
            console.log(`RAG table "${tableName}" created (dim=${dim}, lists=${lists})`);
            return { success: true }
        } catch (error) {
            console.log(`Error creating ${tableName}: ${error.message}`);
            throw error;
        }
    }

    create_rag_documents_table = async()=>{
        return this.create_rag_table_named('rag_documents');
    }

    create_rag_documents_lc_table = async()=>{
        const tableName = process.env.RAG_TABLE_NAME || 'rag_documents_lc';
        return this.create_rag_table_named(tableName);
    }

    // New Personalized Table for Interaction/Chat/Health Records
    create_rag_personal_table = async()=>{
        return this.create_rag_table_named('rag_documents_personal');
    }

    ensure_pgvector_and_rag_documents = async () => {
        await this.enable_pgvector_extension();
        await this.create_rag_documents_table();    // Legacy/default KB table
        await this.create_rag_documents_lc_table(); // Env-configured KB table (rag_documents_lc)
        await this.create_rag_personal_table();     // Personalized info
        return { success: true };
    };

    create_users_table = async()=>{
        try {
            const query = `
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    full_name VARCHAR(255),
                    is_active BOOLEAN DEFAULT true,
                    email_verified BOOLEAN DEFAULT false,
                    verification_token VARCHAR(255),
                    password_reset_token VARCHAR(255),
                    password_reset_expires TIMESTAMP,
                    last_login TIMESTAMP,
                    login_attempts INTEGER DEFAULT 0,
                    locked_until TIMESTAMP,
                    refresh_token TEXT,
                    google_id VARCHAR(100) UNIQUE,
                    provider VARCHAR(50),
                    avatar_url TEXT,
                    phone_number VARCHAR(20),
                    phone_verified BOOLEAN DEFAULT false,
                    phone_verification_code VARCHAR(10),
                    subscription_type VARCHAR(20) NOT NULL DEFAULT 'free',
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );

                CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
                CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
                CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
                CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);
                CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
                CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
            `;

            await this.db_connection.query_executor(query);
            console.log("User table successfully created");
            return {success: true};
        } catch (error) {
            console.log(`Error creating table: ${error.message}`);
            throw error;            
        }
    };

    migrate_users_table_whatsapp = async () => {
        try {
            const query = `
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
                ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
                ADD COLUMN IF NOT EXISTS phone_verification_code VARCHAR(10);
            `;
            await this.db_connection.query_executor(query);
            console.log("Users table migrated for WhatsApp integration");
            return { success: true };
        } catch (error) {
            console.error("Migration failed:", error.message);
            throw error;
        }
    }

    create_user_location_table = async()=>{
        try {
            const query=`
                CREATE TABLE user_locations (
                    id SERIAL PRIMARY KEY,             -- or AUTO_INCREMENT for MySQL
                    user_id INT NOT NULL,
                    address_line VARCHAR(255),
                    city VARCHAR(100),
                    state VARCHAR(100),
                    postal_code VARCHAR(20),
                    country VARCHAR(100),
                    latitude DECIMAL(10, 8),
                    longitude DECIMAL(11, 8),
                    place_id VARCHAR(255),
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
            `;

            await this.db_connection.query_executor(query);
            console.log("User Location table table created successfully");
            return {success: true};
        } catch (error) {
            console.log(`Error creating table: ${error.message}`);
            throw error;
        }
    }

    create_roles_table = async()=>{
        try {
            const query = `
                CREATE TABLE IF NOT EXISTS roles (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(20) UNIQUE NOT NULL CHECK (name IN ('owner', 'vet', 'admin', 'moderator')),
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
            `;

            await this.db_connection.query_executor(query);
            console.log("Roles table created successfully");

            // Insert default roles
            const roleNames = ['owner', 'vet', 'admin', 'moderator'];
            for (const name of roleNames) {
                await this.db_connection.query_executor(
                    `INSERT INTO roles (name) VALUES ($1) ON CONFLICT DO NOTHING;`, [name]
                );
            }

            return {success: true};
        } catch (error) {
            console.log(`Error creating table: ${error.message}`);
            throw error;
        }
    }

    create_user_roles_table = async()=>{
        try {
            const query = `
                CREATE TABLE IF NOT EXISTS user_roles (
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
                    assigned_at TIMESTAMP DEFAULT NOW(),
                    PRIMARY KEY (user_id, role_id)
                );
            `;

            await this.db_connection.query_executor(query);
            console.log("User Roles table created successfully");
            return {success: true};
        } catch (error) {
            console.log(`Error creating table: ${error.message}`);
            throw error;
        }
    }

    create_pets_table = async () => {
        try {
            const query = `
                CREATE TABLE IF NOT EXISTS pets (
                    id SERIAL PRIMARY KEY,
                    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    name VARCHAR(100) NOT NULL,
                    species VARCHAR(30) NOT NULL, -- e.g. 'cat', 'dog', etc.
                    breed VARCHAR(100),
                    sex VARCHAR(10) NOT NULL DEFAULT 'unknown', -- 'male', 'female', 'unknown'
                    birthdate DATE,
                    weight_kg REAL,
                    avatar_url TEXT,
                    is_neutered BOOLEAN DEFAULT false,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_pets_owner_id ON pets(owner_id);
            `;
            await this.db_connection.query_executor(query);
            console.log("Pets table created successfully");
            return { success: true };
        } catch (error) {
            console.log(`Error creating pets table: ${error.message}`);
            throw error;
        }
    }

    create_pet_health_metrics_table = async () => {
        try {
            const query = `
                CREATE TABLE IF NOT EXISTS pet_health_metrics (
                    id SERIAL PRIMARY KEY,
                    pet_id INTEGER REFERENCES pets(id) ON DELETE CASCADE,
                    measured_at TIMESTAMP NOT NULL DEFAULT NOW(),
                    weight_kg REAL,
                    body_temp_c REAL,
                    heart_rate_bpm INTEGER,
                    respiration_rate_bpm INTEGER,
                    gum_color VARCHAR(30),
                    body_condition_score INTEGER,
                    coat_skin VARCHAR(40),
                    appetite_state VARCHAR(30),
                    water_intake_state VARCHAR(30),
                    urine_frequency VARCHAR(30),
                    clump_size VARCHAR(30),
                    stool_consistency VARCHAR(30),
                    blood_in_stool BOOLEAN,
                    straining_to_pee BOOLEAN,
                    no_poop_48h BOOLEAN,
                    note TEXT
                );
                CREATE INDEX IF NOT EXISTS idx_metrics_pet_id ON pet_health_metrics(pet_id);
                ALTER TABLE pet_health_metrics ADD COLUMN IF NOT EXISTS gum_color VARCHAR(30);
                ALTER TABLE pet_health_metrics ADD COLUMN IF NOT EXISTS body_condition_score INTEGER;
                ALTER TABLE pet_health_metrics ADD COLUMN IF NOT EXISTS coat_skin VARCHAR(40);
                ALTER TABLE pet_health_metrics ADD COLUMN IF NOT EXISTS appetite_state VARCHAR(30);
                ALTER TABLE pet_health_metrics ADD COLUMN IF NOT EXISTS water_intake_state VARCHAR(30);
                ALTER TABLE pet_health_metrics ADD COLUMN IF NOT EXISTS urine_frequency VARCHAR(30);
                ALTER TABLE pet_health_metrics ADD COLUMN IF NOT EXISTS clump_size VARCHAR(30);
                ALTER TABLE pet_health_metrics ADD COLUMN IF NOT EXISTS stool_consistency VARCHAR(30);
                ALTER TABLE pet_health_metrics ADD COLUMN IF NOT EXISTS blood_in_stool BOOLEAN;
                ALTER TABLE pet_health_metrics ADD COLUMN IF NOT EXISTS straining_to_pee BOOLEAN;
                ALTER TABLE pet_health_metrics ADD COLUMN IF NOT EXISTS no_poop_48h BOOLEAN;
            `;
            await this.db_connection.query_executor(query);
            console.log("Pet Health Metrics table created successfully");
            return { success: true };
        } catch (error) {
            console.log(`Error creating pet_health_metrics table: ${error.message}`);
            throw error;
        }
    }

    create_vaccinations_table = async () => {
        try {
            const query = `
                CREATE TABLE IF NOT EXISTS vaccinations (
                    id SERIAL PRIMARY KEY,
                    pet_id INTEGER REFERENCES pets(id) ON DELETE CASCADE,
                    vaccine_name VARCHAR(100) NOT NULL,
                    dose_number INTEGER,
                    administered_on DATE,
                    due_on DATE,
                    clinic_id INTEGER REFERENCES vet_clinics(id) ON DELETE SET NULL,
                    vet_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    certificate_url TEXT,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_vaccinations_pet_id ON vaccinations(pet_id);
            `;
            await this.db_connection.query_executor(query);
            console.log("Vaccinations table created successfully");
            return { success: true };
        } catch (error) {
            console.log(`Error creating vaccinations table: ${error.message}`);
            throw error;
        }
    }

    create_dewormings_table = async () => {
        try {
            const query = `
                CREATE TABLE IF NOT EXISTS dewormings (
                    id SERIAL PRIMARY KEY,
                    pet_id INTEGER REFERENCES pets(id) ON DELETE CASCADE,
                    product_name VARCHAR(100) NOT NULL,
                    administered_on DATE,
                    due_on DATE,
                    weight_based_dose VARCHAR(50),
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_dewormings_pet_id ON dewormings(pet_id);
            `;
            await this.db_connection.query_executor(query);
            console.log("Dewormings table created successfully");
            return { success: true };
        } catch (error) {
            console.log(`Error creating dewormings table: ${error.message}`);
            throw error;
        }
    }

    create_reminder_schedules_table = async () => {
        try {
            const query = `
                CREATE TABLE IF NOT EXISTS reminder_schedules (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    pet_id INTEGER REFERENCES pets(id) ON DELETE CASCADE,
                    type VARCHAR(20) NOT NULL CHECK (type IN ('vaccination', 'deworming', 'checkup', 'custom')),
                    title VARCHAR(100) NOT NULL,
                    description TEXT,
                    start_at TIMESTAMP NOT NULL,
                    rrule VARCHAR(255),
                    timezone VARCHAR(50) DEFAULT 'Asia/Dhaka',
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_reminder_user_id ON reminder_schedules(user_id);
                CREATE INDEX IF NOT EXISTS idx_reminder_pet_id ON reminder_schedules(pet_id);
            `;
            await this.db_connection.query_executor(query);
            console.log("Reminder Schedules table created successfully");
            return { success: true };
        } catch (error) {
            console.log(`Error creating reminder_schedules table: ${error.message}`);
            throw error;
        }
    }

    create_notifications_table = async () => {
        try {
            const query = `
                CREATE TABLE IF NOT EXISTS notifications (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    title VARCHAR(100) NOT NULL,
                    body TEXT,
                    scheduled_for TIMESTAMP,
                    sent_at TIMESTAMP,
                    read_at TIMESTAMP,
                    meta JSONB,
                    created_at TIMESTAMP DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
                CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notifications(scheduled_for);
            `;
            await this.db_connection.query_executor(query);
            console.log("Notifications table created successfully");
            return { success: true };
        } catch (error) {
            console.log(`Error creating notifications table: ${error.message}`);
            throw error;
        }
    }

    create_vet_clinics_table = async () => {
        try {
            const query = `
                CREATE TABLE IF NOT EXISTS vet_clinics (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    phone VARCHAR(30),
                    email VARCHAR(100),
                    address TEXT,
                    latitude REAL,
                    longitude REAL,
                    hours JSONB,
                    is_verified BOOLEAN DEFAULT false,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
            `;
            await this.db_connection.query_executor(query);
            console.log("Vet Clinics table created successfully");
            return { success: true };
        } catch (error) {
            console.log(`Error creating vet_clinics table: ${error.message}`);
            throw error;
        }
    }

    create_vets_table = async () => {
        try {
            const query = `
                CREATE TABLE IF NOT EXISTS vets (
                    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                    name VARCHAR(100) NOT NULL,
                    clinic_id INTEGER REFERENCES vet_clinics(id) ON DELETE SET NULL,
                    license_number VARCHAR(50),
                    license_issuer VARCHAR(100),
                    license_valid_until DATE,
                    specialization VARCHAR(100),
                    rating_avg REAL DEFAULT 0,
                    rating_count INTEGER DEFAULT 0,
                    verified BOOLEAN DEFAULT false,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
            `;
            await this.db_connection.query_executor(query);
            console.log("Vets table created successfully");
            return { success: true };
        } catch (error) {
            console.log(`Error creating vets table: ${error.message}`);
            throw error;
        }
    }

    create_vet_reviews_table = async () => {
        try {
            const query = `
                CREATE TABLE IF NOT EXISTS vet_reviews (
                    id SERIAL PRIMARY KEY,
                    reviewer_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    vet_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    clinic_id INTEGER REFERENCES vet_clinics(id) ON DELETE SET NULL,
                    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                    title VARCHAR(100),
                    body TEXT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    UNIQUE (reviewer_user_id, vet_user_id)
                );
            `;
            await this.db_connection.query_executor(query);
            console.log("Vet Reviews table created successfully");
            return { success: true };
        } catch (error) {
            console.log(`Error creating vet_reviews table: ${error.message}`);
            throw error;
        }
    }

    create_appointments_table = async () => {
        try {
            const query = `
                CREATE TABLE IF NOT EXISTS appointments (
                    id SERIAL PRIMARY KEY,
                    pet_id INTEGER REFERENCES pets(id) ON DELETE CASCADE,
                    owner_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    vet_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    clinic_id INTEGER REFERENCES vet_clinics(id) ON DELETE SET NULL,
                    starts_at TIMESTAMP NOT NULL,
                    ends_at TIMESTAMP,
                    status VARCHAR(20) NOT NULL CHECK (status IN ('requested', 'confirmed', 'completed', 'cancelled', 'no_show')),
                    reason TEXT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
            `;
            await this.db_connection.query_executor(query);
            console.log("Appointments table created successfully");
            return { success: true };
        } catch (error) {
            console.log(`Error creating appointments table: ${error.message}`);
            throw error;
        }
    }

    create_emergency_requests_table = async () => {
        try {
            const query = `
                CREATE TABLE IF NOT EXISTS emergency_requests (
                    id SERIAL PRIMARY KEY,
                    pet_id INTEGER REFERENCES pets(id) ON DELETE CASCADE,
                    requester_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    clinic_id INTEGER REFERENCES vet_clinics(id) ON DELETE SET NULL,
                    description TEXT,
                    status VARCHAR(20) NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'cancelled')),
                    requested_at TIMESTAMP DEFAULT NOW(),
                    accepted_by_vet_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    accepted_at TIMESTAMP,
                    resolved_at TIMESTAMP,
                    location_lat REAL,
                    location_lng REAL,
                    meta JSONB
                );
                CREATE INDEX IF NOT EXISTS idx_emergency_pet_id ON emergency_requests(pet_id);
                CREATE INDEX IF NOT EXISTS idx_emergency_requester_user_id ON emergency_requests(requester_user_id);
                CREATE INDEX IF NOT EXISTS idx_emergency_status ON emergency_requests(status);
            `;
            await this.db_connection.query_executor(query);
            console.log("Emergency Requests table created successfully");
            return { success: true };
        } catch (error) {
            console.log(`Error creating emergency_requests table: ${error.message}`);
            throw error;
        }
    }

    create_media_assets_table = async () => {
        try {
            const query = `
                CREATE TABLE IF NOT EXISTS media_assets (
                    id SERIAL PRIMARY KEY,
                    owner_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    pet_id INTEGER REFERENCES pets(id) ON DELETE CASCADE,
                    url TEXT NOT NULL,
                    content_type VARCHAR(50),
                    width INTEGER,
                    height INTEGER,
                    taken_at TIMESTAMP,
                    meta JSONB,
                    created_at TIMESTAMP DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_media_owner_user_id ON media_assets(owner_user_id);
                CREATE INDEX IF NOT EXISTS idx_media_pet_id ON media_assets(pet_id);
            `;
            await this.db_connection.query_executor(query);
            console.log("Media Assets table created successfully");
            return { success: true };
        } catch (error) {
            console.log(`Error creating media_assets table: ${error.message}`);
            throw error;
        }
    }

    create_anomaly_jobs_table = async () => {
        try {
            const query = `
                CREATE TABLE IF NOT EXISTS anomaly_jobs (
                    id SERIAL PRIMARY KEY,
                    requester_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    pet_id INTEGER REFERENCES pets(id) ON DELETE CASCADE,
                    media_id INTEGER REFERENCES media_assets(id) ON DELETE CASCADE,
                    status VARCHAR(20) NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
                    requested_at TIMESTAMP DEFAULT NOW(),
                    started_at TIMESTAMP,
                    completed_at TIMESTAMP,
                    model_name VARCHAR(100),
                    inference_ms INTEGER,
                    error_message TEXT
                );
                CREATE INDEX IF NOT EXISTS idx_anomaly_jobs_media_id ON anomaly_jobs(media_id);
            `;
            await this.db_connection.query_executor(query);
            console.log("Anomaly Jobs table created successfully");
            return { success: true };
        } catch (error) {
            console.log(`Error creating anomaly_jobs table: ${error.message}`);
            throw error;
        }
    }

    create_anomaly_results_table = async () => {
        try {
            const query = `
                CREATE TABLE IF NOT EXISTS anomaly_results (
                    id SERIAL PRIMARY KEY,
                    job_id INTEGER REFERENCES anomaly_jobs(id) ON DELETE CASCADE,
                    label VARCHAR(100),
                    confidence REAL CHECK (confidence >= 0 AND confidence <= 1),
                    bbox JSONB,
                    advice TEXT
                );
                CREATE INDEX IF NOT EXISTS idx_anomaly_results_job_id ON anomaly_results(job_id);
            `;
            await this.db_connection.query_executor(query);
            console.log("Anomaly Results table created successfully");
            return { success: true };
        } catch (error) {
            console.log(`Error creating anomaly_results table: ${error.message}`);
            throw error;
        }
    }

    create_chat_sessions_table = async () => {
        try {
            const query = `
                CREATE TABLE IF NOT EXISTS chat_sessions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    pet_id INTEGER REFERENCES pets(id) ON DELETE SET NULL,
                    title VARCHAR(100) DEFAULT 'Chat Session',
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
            `;
            await this.db_connection.query_executor(query);
            console.log("Chat Sessions table created successfully");
            return { success: true };
        } catch (error) {
            console.log(`Error creating chat_sessions table: ${error.message}`);
            throw error;
        }
    }

    create_chat_messages_table = async () => {
        try {
            const query = `
                CREATE TABLE IF NOT EXISTS chat_messages (
                    id SERIAL PRIMARY KEY,
                    session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE,
                    sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'assistant', 'system')),
                    content TEXT NOT NULL,
                    attachments JSONB,
                    created_at TIMESTAMP DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
            `;
            await this.db_connection.query_executor(query);
            console.log("Chat Messages table created successfully");
            return { success: true };
        } catch (error) {
            console.log(`Error creating chat_messages table: ${error.message}`);
            throw error;
        }
    }

    create_rag_sources_table = async () => {
        try {
            const query = `
                CREATE TABLE IF NOT EXISTS rag_sources (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(200) NOT NULL,
                    uri TEXT,
                    doc_type VARCHAR(50),
                    locale VARCHAR(20),
                    checksum VARCHAR(100),
                    qdrant_collection VARCHAR(100),
                    qdrant_point_id VARCHAR(100),
                    metadata JSONB,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            `;
            await this.db_connection.query_executor(query);
            console.log("RAG Sources table created successfully");
            return { success: true };
        } catch (error) {
            console.log(`Error creating rag_sources table: ${error.message}`);
            throw error;
        }
    }

    create_pet_diseases_table = async () => {
        try {
            const query = `
                CREATE TABLE IF NOT EXISTS pet_diseases (
                    id SERIAL PRIMARY KEY,
                    pet_id INTEGER REFERENCES pets(id) ON DELETE CASCADE,
                    disease_name VARCHAR(150) NOT NULL,
                    symptoms TEXT,
                    severity VARCHAR(20) CHECK (severity IN ('mild','moderate','severe')) DEFAULT 'mild',
                    status VARCHAR(20) CHECK (status IN ('active','resolved')) DEFAULT 'active',
                    diagnosed_on DATE,
                    resolved_on DATE,
                    vet_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    clinic_id INTEGER REFERENCES vet_clinics(id) ON DELETE SET NULL,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_pet_diseases_pet_id ON pet_diseases(pet_id);
                CREATE INDEX IF NOT EXISTS idx_pet_diseases_status ON pet_diseases(status);
            `;
            await this.db_connection.query_executor(query);
            console.log("Pet Diseases table created successfully");
            return { success: true };
        } catch (error) {
            console.log(`Error creating pet_diseases table: ${error.message}`);
            throw error;
        }
    }

    create_request_table = async () => {
        try {
            const query = `
                CREATE TABLE IF NOT EXISTS requests (
                    id SERIAL PRIMARY KEY,
                    issue_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    status BOOLEAN DEFAULT FALSE,
                    content_url VARCHAR(200) NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
            `;
            await this.db_connection.query_executor(query);
            console.log("Requests table created");
            return { success: true };
        } catch (error) {
            console.error(error.message + " while creating requests table");
            throw error;
        }
    }

    create_vet_approve_table = async () => {
        try {
            const query = `
                CREATE TABLE IF NOT EXISTS vet_approved (
                    vet_id INTEGER REFERENCES vets(user_id) ON DELETE SET NULL,
                    req_id INTEGER REFERENCES requests(id) ON DELETE SET NULL,
                    note TEXT,
                    approved_at TIMESTAMP DEFAULT NOW(),
                    CONSTRAINT pk PRIMARY KEY (req_id)
                    );
                
                CREATE INDEX IF NOT EXISTS idx_vet_approved_vet_id ON vet_approved(vet_id);
            `;
            await this.db_connection.query_executor(query);
            console.log("Vet approved table created");
            return { success: true };
        } catch (error) {
            console.error(error.message + " while creating vet approved table");
            throw error;
        }
    }
}

module.exports = TableCreation;