const UserModel = require('../models/user.model');
const bcrypt = require('bcryptjs');

/**
 * Contrôleur pour la gestion des utilisateurs par l'administrateur
 */
const AdminController = {
    /**
     * Récupère la liste des utilisateurs
     * @param {Object} req - Requête Express
     * @param {Object} res - Réponse Express
     */
    async getUsers(req, res) {
        try {
            const users = await UserModel.findAll();
            res.json(users);
        } catch (error) {
            console.error('Erreur lors de la récupération des utilisateurs:', error);
            res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
        }
    },

    /**
     * Récupère un utilisateur par son ID
     * @param {Object} req - Requête Express
     * @param {Object} res - Réponse Express
     */
    async getUserById(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const user = await UserModel.findById(userId);
            
            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }
            
            res.json(user);
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'utilisateur:', error);
            res.status(500).json({ message: 'Erreur lors de la récupération de l\'utilisateur' });
        }
    },

    /**
     * Crée un nouvel utilisateur
     * @param {Object} req - Requête Express
     * @param {Object} res - Réponse Express
     */
    async createUser(req, res) {
        try {
            const { username, email, full_name, role, password } = req.body;

            // Vérification si l'utilisateur existe déjà
            const userExists = await UserModel.exists(username, email);
            if (userExists) {
                return res.status(409).json({ 
                    message: 'Un utilisateur avec ce nom d\'utilisateur ou cet email existe déjà' 
                });
            }

            // Création de l'utilisateur
            const user = await UserModel.create({
                username,
                password,
                email,
                full_name,
                role
            });

            res.status(201).json({
                message: 'Utilisateur créé avec succès',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Erreur lors de la création de l\'utilisateur:', error);
            res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur' });
        }
    },

    /**
     * Met à jour un utilisateur
     * @param {Object} req - Requête Express
     * @param {Object} res - Réponse Express
     */
    async updateUser(req, res) {
        try {
            const userId = req.params.id;
            const { email, full_name, role, password } = req.body;

            // Vérification si l'utilisateur existe
            const user = await UserModel.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            // Préparation des données à mettre à jour
            const updateData = {
                email,
                full_name,
                role
            };

            // Si un nouveau mot de passe est fourni, l'ajouter
            if (password) {
                updateData.password = password;
            }

            // Mise à jour de l'utilisateur
            await UserModel.update(userId, updateData);

            res.json({
                message: 'Utilisateur mis à jour avec succès',
                user: {
                    id: userId,
                    ...updateData
                }
            });
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
            res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur' });
        }
    },

    /**
     * Supprime un utilisateur
     * @param {Object} req - Requête Express
     * @param {Object} res - Réponse Express
     */
    async deleteUser(req, res) {
        try {
            const userId = req.params.id;

            // Vérification si l'utilisateur existe
            const user = await UserModel.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            // Suppression de l'utilisateur
            await UserModel.delete(userId);

            res.json({ message: 'Utilisateur supprimé avec succès' });
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'utilisateur:', error);
            res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur' });
        }
    }
};

module.exports = AdminController; 