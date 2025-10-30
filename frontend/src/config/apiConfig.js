const apiConfig = {
  baseURL: 'http://localhost:3000',
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
  },
  tables: {
    init: '/api/init-tables',
  },
  pets: {
    create: '/api/pets',
    listMine: '/api/pets',
  },
  care: {
    addVaccination: '/api/care/vaccination',
    addDeworming: '/api/care/deworming',
    addReminder: '/api/care/reminder',
    addNotification: '/api/care/notification',
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
}

export default apiConfig