const apiConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    googleLogin: '/api/auth/google-login',
    verifyToken: '/api/auth/verify-token',
    sendVerificationEmail: '/api/auth/send-verification-email',
    verifyEmail: '/api/auth/verify-email',
    requestPasswordReset: '/api/auth/password/request',
    resetPassword: '/api/auth/password/reset',
    changePassword: '/api/auth/password/change',
    logout: (userId) => `/api/auth/logout/${userId}`,
  },
  users: {
    getProfile: (userId) => `/api/user/get-profile/${userId}`,
    updateProfile: (userId) => `/api/user/update-profile/${userId}`,
    updateSubscription: (userId) => `/api/user/subscription/${userId}`,
    uploadAvatar: (userId) => `/api/user/avatar/${userId}`,
    locations: {
      listMine: '/api/user/locations',
      create: '/api/user/locations',
      update: (id) => `/api/user/locations/${id}`,
      remove: (id) => `/api/user/locations/${id}`,
    }
  },
  tables: {
    init: '/api/init-tables',
  },
  pets: {
    create: '/api/pets',
    listMine: '/api/pets',
    uploadAvatar: (petId) => `/api/pets/${petId}/avatar`,
    summary: (petId) => `/api/pets/${petId}/summary`,
    update: (petId) => `/api/pets/${petId}`,           
    metrics: {                                          
      add: (petId) => `/api/pets/${petId}/metrics`,     
    },
    diseases: {
      list: (petId) => `/api/pets/${petId}/diseases`,
      listActive: (petId) => `/api/pets/${petId}/diseases/active`,
      create: (petId) => `/api/pets/${petId}/diseases`,
      getOne: (id) => `/api/diseases/${id}`,
      update: (id) => `/api/diseases/${id}`,
      remove: (id) => `/api/diseases/${id}`,
    }
  },
  care: {
    addVaccination: '/api/care/vaccinations',
    addDeworming: '/api/care/dewormings'
  },
  vets:{
    update: (user_id) => `/api/vets/${user_id}`,
  },
  clinics: {
    createClinic: '/api/clinics',
    createVetProfile: '/api/vets',
    addReview: '/api/vet-reviews',
    createAppointment: '/api/appointments',
  },
  emergency: {
    createRequest: '/api/emergency',
    listMyRequests: '/api/emergency',
  },
  anomaly: {
    uploadMedia: '/api/anomaly/media',
    createJob: '/api/anomaly/job',
    addResult: '/api/anomaly/result',
  },
  chat: {
    createSession: '/api/chat/session',
    updateSessionTitle: (sessionId) => `/api/chat/session/${sessionId}/title`,
    addMessage: '/api/chat/message',
    listMessages: (sessionId) => `/api/chat/session/${sessionId}/messages`,
    addRagSource: '/api/chat/rag-source',
  },

  googleMapsApiKey: "AIzaSyDs43IZ9rUBN_E6tPSU130RGQAul0Wj2ds", 
 
}

export default apiConfig