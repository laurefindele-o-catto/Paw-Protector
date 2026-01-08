const {v2:cloudinary} = require('cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadAvatarBuffer = (buffer, userId) => {
    return new Promise((resolve, reject) => {
        const folder = process.env.CLOUDINARY_FOLDER || 'avatars';
        const upload = cloudinary.uploader.upload_stream(
            {
                folder,
                public_id: `user_${userId}_${Date.now()}`,
                resource_type: 'image',
                overwrite: true,
                transformation: [
                    { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                    { quality: 'auto', fetch_format: 'auto' }
                ]
            },
            (err, result) => {
                if (err) return reject(err);
                resolve(result);
            }
        );
        upload.end(buffer);
    });
};

const uploadPetAvatarBuffer = (buffer, petId) => {
    return new Promise((resolve, reject) => {
        const folder = process.env.CLOUDINARY_PET_FOLDER || 'pets';
        const upload = cloudinary.uploader.upload_stream(
            {
                folder,
                public_id: `pet_${petId}_${Date.now()}`,
                resource_type: 'image',
                overwrite: true,
                transformation: [
                    { width: 600, height: 600, crop: 'fill', gravity: 'auto' },
                    { quality: 'auto', fetch_format: 'auto' }
                ]
            },
            (err, result) => {
                if (err) return reject(err);
                resolve(result);
            }
        );
        upload.end(buffer);
    });
};

const uploadRequestContentBuffer = (buffer, userId) => {
    return new Promise((resolve, reject) => {
        const folder = process.env.CLOUDINARY_REQUESTS_FOLDER || 'requests';
        const upload = cloudinary.uploader.upload_stream(
            {
                folder,
                public_id: `request_${userId}_${Date.now()}`,
                resource_type: 'auto',
                overwrite: true,
                transformation: [
                    { width: 1200, height: 1200, crop: 'limit' },
                    { quality: 'auto:good' }
                ]
            },
            (err, result) => {
                if (err) return reject(err);
                resolve(result);
            }
        );
        upload.end(buffer);
    });
};

module.exports = {
    uploadAvatarBuffer,
    uploadPetAvatarBuffer,
    uploadRequestContentBuffer
}