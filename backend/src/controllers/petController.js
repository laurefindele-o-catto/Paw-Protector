const PetModel = require('../models/petModel.js');

class PetController {
    constructor() {
        this.petModel = new PetModel();
    }

    addPet = async (req, res) => {
        try {
            const owner_id = req.user.id; // assuming auth middleware sets req.user
            const {
                name, species, breed, sex,
                birthdate, weight_kg, avatar_url, is_neutered, notes,
                last_rabies_vac, last_flu_vac, last_deworm
            } = req.body;

            // const file = req.file;

            if (!name || !species) {
                return res.status(400).json({ success: false, error: 'Name and species are required' });
            }

            const pet = await this.petModel.createPet({
                owner_id, name, species, breed, sex,
                birthdate, weight_kg, avatar_url, is_neutered, notes,
                last_rabies_vac, last_flu_vac, last_deworm
            });

            if (!pet || pet.success === false) {
                return res.status(500).json({ success: false, error: 'Failed to add pet' });
            }

            return res.status(201).json({ success: true, pet });
        } catch (error) {
            console.error('Add pet error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

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
}

module.exports = PetController;