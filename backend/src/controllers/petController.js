const PetModel = require('../models/petModel.js');
const { uploadPetAvatarBuffer } = require('../utils/cloudinary.js');

class PetController {
    constructor() {
        this.petModel = new PetModel();
    }

    // Creates a pet
    addPet = async (req, res) => {
        try {
            const owner_id = req.user.id; 
            const { name, species, breed, sex, birthdate, weight_kg, avatar_url, is_neutered, notes } = req.body;
            if (!name || !species) return res.status(400).json({ success: false, error: 'Name and species are required' });

            const pet = await this.petModel.createPet({ owner_id, name, species, breed, sex, birthdate, weight_kg, avatar_url, is_neutered, notes });
            if (!pet || pet.success === false) return res.status(500).json({ success: false, error: 'Failed to add pet' });

            return res.status(201).json({ success: true, pet });
        } catch (error) {
            console.error('Add pet error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

    // Lists my pets
    getMyPets = async (req, res) => {
        try {
            const owner_id = req.user.id;
            const pets = await this.petModel.getPetsByOwner(owner_id);
            return res.status(200).json({ success: true, pets });
        } catch (error) {
            console.error('Get pets error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

    // Uploads a pet avatar to Cloudinary and stores the url
    uploadAvatar = async (req, res) => {
        try {
            const { petId } = req.params;
            const file = req.file;
            const id = parseInt(petId, 10);

            if (!id) return res.status(400).json({ success: false, error: 'Valid pet id required' });
            if (!file) return res.status(400).json({ success: false, error: 'Avatar file is required' });
            if (!/^image\/(png|jpe?g|webp)$/i.test(file.mimetype)) return res.status(400).json({ success: false, error: 'Unsupported image type' });

            const pet = await this.petModel.getPetById(id);
            if (!pet || pet.owner_id !== req.user.id) return res.status(404).json({ success: false, error: 'Pet not found' });

            const result = await uploadPetAvatarBuffer(file.buffer, id);
            const updatedPet = await this.petModel.updatePetAvatar(id, result.secure_url);
            if (!updatedPet) return res.status(500).json({ success: false, error: 'Failed to update pet with avatar url' });

            return res.status(200).json({ success: true, pet: updatedPet });
        } catch (error) {
            console.error('Upload pet avatar error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };
}

module.exports = PetController;