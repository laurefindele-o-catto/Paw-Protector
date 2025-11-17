# Utils

These are small, reusable helpers used across controllers, models, and services. Keep them simple, side‑effect free (where possible), and focused on one thing.

What lives here
- `cloudinary.js`: All the image uploading logic lives here. We use Cloudinary to upload avatars and pet photos from memory (no temp files). Configure these in your `.env`:
	- `CLOUDINARY_CLOUD_NAME`
	- `CLOUDINARY_API_KEY`
	- `CLOUDINARY_API_SECRET`
	Optional: default folder/preset if you want tighter control. The helpers return the hosted image URL you can store in DB.

- `emailUtils.js`: Nodemailer setup + a tiny `sendEmail(to, subject, html)` helper. By default this is wired for Mailtrap in development so you can preview emails safely. Swap credentials to your SMTP when you go live.

- `verificationMailer.js`: Ready‑made email builder/sender for account verification. It assembles a clean message with a token link and calls `sendEmail` under the hood. Use it from controllers when a user registers or requests a new verification email.

Conventions
- No Express or DB code here; just pure helpers and client initializers.
- Keep return values predictable (URLs, booleans, or plain objects).
- Prefer passing dependencies (like tokens/links) as parameters rather than reading global state.
