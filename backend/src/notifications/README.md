# Notifications

Anything that reaches the user outside of the immediate HTTP response—emails, push, socket pings—starts here.

Files
- `notificationService.js`: A small “traffic controller” for outbound messages. Today it mostly listens to events and decides what to send (often delegating to sockets or email helpers).

Related utils
- `../utils/emailUtils.js`: Nodemailer + Mailtrap setup and `sendEmail` helper.
- `../utils/verificationMailer.js`: Prebuilt verification email sender.

Extending
- Add new channels (SMS, push provider, WhatsApp) as separate modules and subscribe to the relevant events in this service.
