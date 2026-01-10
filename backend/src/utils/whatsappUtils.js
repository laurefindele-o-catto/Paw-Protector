const https = require('https');

class WhatsAppUtils {
    constructor() {
        this.accountSid = process.env.TWILIO_ACCOUNT_SID; 
        this.authToken = process.env.TWILIO_AUTH_TOKEN;
        this.fromNumber = process.env.TWILIO_PHONE_NUMBER; // Your Twilio WhatsApp Number (e.g., 'whatsapp:+14155238886')
        
        if (this.accountSid && this.authToken) {
            // Lazy load Twilio to avoid startup crashes if not configured
            try {
                this.client = require('twilio')(this.accountSid, this.authToken);
            } catch (e) {
                console.warn("Twilio package not installed. Run: npm install twilio");
            }
        }
    }

    async sendMessage(to, message) {
        if (!this.client) {
            console.warn("Twilio client not initialized. Check Env variables and dependencies.");
            return false;
        }

        try {
            // Ensure numbers are formatted for Twilio WhatsApp (prefix with 'whatsapp:')
            const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
            const formattedFrom = this.fromNumber.startsWith('whatsapp:') ? this.fromNumber : `whatsapp:${this.fromNumber}`;

            const response = await this.client.messages.create({
                body: message,
                from: formattedFrom,
                to: formattedTo
            });
            
            console.log(`WhatsApp message sent to ${to}: ${response.sid}`);
            return response;
        } catch (error) {
            console.error("Twilio WhatsApp Error:", error.message);
            return null;
        }
    }

    async sendVerificationCode(to, code) {
        const message = `Your PawPal verification code is: ${code}`;
        return this.sendMessage(to, message);
    }
    
    async sendWelcomeMessage(to, username) {
        const message = `Welcome to PawPal, ${username}! Your account is now verified. We will keep you updated with your pet's health schedules.`;
        return this.sendMessage(to, message);
    }
}

module.exports = new WhatsAppUtils();
