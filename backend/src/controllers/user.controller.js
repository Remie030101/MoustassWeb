const { validationResult } = require('express-validator');
const UserModel = require('../models/user.model');
const AccessLogModel = require('../models/accesslog.model');

/**
 * Contrôleur pour gérer les utilisateurs
 */
const UserController = {
  /**
   * Récupère tous les utilisateurs (admin uniquement)
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  getAllUsers: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      
      const users = await UserModel.findAll(limit, offset);
      
      res.json({
        page,
        limit,
        users
      });
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
  getUserById: async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Vérification des permissions
      if (req.user.role !== 'admin' && req.user.id !== userId) {
        return res.status(403).json({ message: 'Accès non autorisé' });
      }
      
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
   * Récupère le profil de l'utilisateur connecté
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  getProfile: async (req, res) => {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      res.json(user);
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  },
  
  /**
   * Met à jour un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  updateUser: async (req, res) => {
    try {
      // Validation des entrées
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const userId = parseInt(req.params.id);
      
      // Vérification des permissions
      if (req.user.role !== 'admin' && req.user.id !== userId) {
        return res.status(403).json({ message: 'Accès non autorisé' });
      }
      
      // Vérification de l'existence de l'utilisateur
      const userExists = await UserModel.findById(userId);
      if (!userExists) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      
      // Préparation des données à mettre à jour
      const updateData = {};
      
      // L'admin peut modifier le rôle et le statut actif
      if (req.user.role === 'admin') {
        if (req.body.role) updateData.role = req.body.role;
        if (req.body.is_active !== undefined) updateData.is_active = req.body.is_active;
      }
      
      // Tout utilisateur peut modifier son email et son nom complet
      if (req.body.email) updateData.email = req.body.email;
      if (req.body.full_name) updateData.full_name = req.body.full_name;
      
      // Mise à jour de l'utilisateur
      const updated = await UserModel.update(userId, updateData);
      
      if (!updated) {
        return res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur' });
      }
      
      // Journalisation de l'action
      await AccessLogModel.create({
        user_id: req.user.id,
        action: 'USER_UPDATE',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        success: true
      });
      
      // Récupération des données mises à jour
      const updatedUser = await UserModel.findById(userId);
      
      res.json({
        message: 'Utilisateur mis à jour avec succès',
        user: updatedUser
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur' });
    }
  },
  
  /**
   * Supprime un utilisateur (admin uniquement)
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  deleteUser: async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Vérification de l'existence de l'utilisateur
      const userExists = await UserModel.findById(userId);
      if (!userExists) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      
      // Suppression de l'utilisateur
      const deleted = await UserModel.delete(userId);
      
      if (!deleted) {
        return res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur' });
      }
      
      // Journalisation de l'action
      await AccessLogModel.create({
        user_id: req.user.id,
        action: 'USER_DELETE',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        success: true
      });
      
      res.json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur' });
    }
  },
  
  /**
   * Met à jour le profil de l'utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  updateProfile: async (req, res) => {
    try {
      const { email, full_name } = req.body;
      const updateData = {};

      if (email) updateData.email = email;
      if (full_name) updateData.full_name = full_name;

      const updated = await UserModel.update(req.user.id, updateData);

      if (!updated) {
        return res.status(500).json({ message: 'Erreur lors de la mise à jour du profil' });
      }

      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      res.json(user);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  },
  
  /**
   * Récupère un utilisateur par son ID
   */
  getUser: async (req, res) => {
    try {
      const user = await UserModel.findById(req.params.id).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }
};

module.exports = UserController;