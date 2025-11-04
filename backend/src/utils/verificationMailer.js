const nodemailer = require("nodemailer");

class VerificationMailer {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail", // or SMTP config
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendVetVerificationRequest(vet) {
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: "pawmeowmanool@gmail.com", // BVC or your admin inbox info@bvc.bd.bd"
      subject: `Vet Verification Request: ${vet.name}`,
      text: `
A new vet has registered/updated and requires verification:

Name: ${vet.name}
Clinic ID: ${vet.clinic_id}
License Number: ${vet.license_number}
License Issuer: ${vet.license_issuer}
License Valid Until: ${vet.license_valid_until}
Specialization: ${vet.specialization}

Please confirm this license manually.
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}

module.exports = VerificationMailer;