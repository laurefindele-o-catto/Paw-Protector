const path = require('path');

const swaggerJsdocOptions = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Auth Template API',
      version: '1.0.0',
      description: 'Reusable Node.js authentication & user management template.'
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Local Dev' }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Add access token: Bearer <token>'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            email_verified: { type: 'boolean' },
            subscription_type: { type: 'string', enum: ['free','plus','premium'] },
            avatar_url: { type: 'string' }
          }
        },
        Pet: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            owner_id: { type: 'integer' },
            name: { type: 'string' },
            species: { type: 'string' },
            breed: { type: 'string' },
            gender: { type: 'string' },
            birthdate: { type: 'string', format: 'date' },
            avatar_url: { type: 'string' }
          }
        },
        PetMetric: {
          type: 'object',
          properties: {
            type: { type: 'string', example: 'weight' },
            value: { type: 'number' },
            unit: { type: 'string', example: 'kg' },
            measured_at: { type: 'string', format: 'date-time' }
          },
          required: ['type','value','measured_at']
        },
        ChatSession: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            user_id: { type: 'integer' },
            title: { type: 'string' }
          }
        },
        ChatMessage: {
          type: 'object',
          properties: {
            session_id: { type: 'string' },
            role: { type: 'string', enum: ['user','assistant','tool'] },
            content: { type: 'string' }
          },
          required: ['session_id','role','content']
        },
        RagUpsertRequest: {
          type: 'object',
          properties: {
            pet_id: { type: 'integer' },
            doc_type: { type: 'string' },
            content: { type: 'string' },
            metadata: { type: 'object' }
          },
          required: ['doc_type','content']
        },
        AgentChatResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        },
        CarePlan: {
          type: 'object',
          properties: {
            week_start: { type: 'string', format: 'date' },
            days: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  morning: { type: 'array', items: { type: 'string' } },
                  midday: { type: 'array', items: { type: 'string' } },
                  evening: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        CareSummary: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Vaccination: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            pet_id: { type: 'integer' },
            name: { type: 'string' },
            dose_date: { type: 'string', format: 'date' }
          }
        },
        Deworming: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            pet_id: { type: 'integer' },
            name: { type: 'string' },
            dose_date: { type: 'string', format: 'date' }
          }
        },
        Clinic: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            address: { type: 'string' },
            lat: { type: 'number' },
            lng: { type: 'number' }
          }
        },
        Vet: {
          type: 'object',
          properties: {
            user_id: { type: 'integer' },
            clinic_id: { type: 'integer' },
            specialties: { type: 'array', items: { type: 'string' } },
            years_experience: { type: 'integer' }
          }
        },
        Review: {
          type: 'object',
          properties: {
            vet_user_id: { type: 'integer' },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            comment: { type: 'string' }
          },
          required: ['vet_user_id','rating']
        },
        Appointment: {
          type: 'object',
          properties: {
            vet_user_id: { type: 'integer' },
            clinic_id: { type: 'integer' },
            pet_id: { type: 'integer' },
            scheduled_at: { type: 'string', format: 'date-time' }
          },
          required: ['vet_user_id','pet_id','scheduled_at']
        },
        EmergencyRequest: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            lat: { type: 'number' },
            lng: { type: 'number' }
          },
          required: ['description']
        }
      }
    },
    security: [
      { BearerAuth: [] }
    ],
    tags: [
      { name: 'Auth', description: 'Authentication & tokens' },
      { name: 'User', description: 'User profile & settings' },
      { name: 'Chat', description: 'Chat sessions, messages and agent' },
      { name: 'RAG', description: 'Vector upsert and search' },
      { name: 'Care', description: 'Weekly plans, summaries and schedules' },
      { name: 'Pet', description: 'Pet profiles, metrics and media' },
      { name: 'Clinic/Vet', description: 'Clinics, vets, reviews and appointments' },
      { name: 'Disease', description: 'Pet disease records' },
      { name: 'Emergency', description: 'Emergency requests' },
      { name: 'Anomaly', description: 'Image anomaly detection' },
      { name: 'System', description: 'Utilities & setup' }
    ]
  },
  apis: [
    path.join(__dirname, '..', 'routes', '*.js'),
    path.join(__dirname, '..', 'controllers', '*.js')
  ]
};

module.exports = {
  swaggerJsdocOptions
};