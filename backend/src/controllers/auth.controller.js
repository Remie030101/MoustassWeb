const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const UserModel = require('../models/user.model');
const security = require('../utils/security');
const AccessLogModel = require('../models/accesslog.model');
const { sendEmail } = require('../utils/email');

/**
 * Contrôleur pour gérer l'authentification
 */
const AuthController = {
  /**
   * Inscription d'un nouvel utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  register: async (req, res) => {
    try {
      // Validation des entrées
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { username, password, email, full_name } = req.body;
      
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
        role: 'user' // Par défaut
      });
      
      // Journalisation de l'action
      await AccessLogModel.create({
        user_id: user.id,
        action: 'REGISTER',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        success: true
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
      console.error('Erreur lors de l\'inscription:', error);
      res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur' });
    }
  },
  
  /**
   * Connecte un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async login(req, res) {
    try {
      const { username, password, loginType } = req.body;

      // Vérification des champs requis
      if (!username || !password) {
        return res.status(400).json({ message: 'Tous les champs sont requis' });
      }

      // Recherche de l'utilisateur
      const user = await UserModel.findByUsername(username);

      if (!user) {
        return res.status(401).json({ message: 'Identifiants invalides' });
      }

      // Vérification du mot de passe
      if (!user.password_hash) {
        console.error('Mot de passe non trouvé pour l\'utilisateur:', username);
        return res.status(500).json({ message: 'Erreur lors de la vérification du mot de passe' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({ message: 'Identifiants invalides' });
      }

      // Vérification du type de connexion
      if (loginType === 'admin' && user.role !== 'admin') {
        return res.status(403).json({ message: 'Accès non autorisé' });
      }

      // Génération du token JWT
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Suppression du mot de passe des données utilisateur
      delete user.password_hash;

      res.json({
        token,
        user,
        message: 'Connexion réussie'
      });
    } catch (error) {
      console.error('Erreur de connexion:', error);
      res.status(500).json({ message: 'Erreur lors de la connexion' });
    }
  },
  
  /**
   * Déconnexion d'un utilisateur (côté serveur)
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  logout: async (req, res) => {
    try {
      // Comme JWT est stateless, on se contente de journaliser la déconnexion
      // Le token devra être supprimé côté client
      if (req.user) {
        await AccessLogModel.create({
          user_id: req.user.id,
          action: 'LOGOUT',
          ip_address: req.ip,
          user_agent: req.headers['user-agent'],
          success: true
        });
      }
      
      res.json({ message: 'Déconnexion réussie' });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      res.status(500).json({ message: 'Erreur lors de la déconnexion' });
    }
  },
  
  /**
   * Vérifie la validité du token JWT
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  verifyToken: (req, res) => {
    // Si cette route est atteinte, c'est que le middleware auth a validé le token
    res.json({ 
      valid: true,
      user: req.user
    });
  },
  
  /**
   * Modification du mot de passe
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;
      
      // Récupération de l'utilisateur
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      
      // Vérification que le hash du mot de passe existe
      if (!user.password_hash) {
        console.error('Hash du mot de passe non trouvé pour l\'utilisateur:', userId);
        return res.status(500).json({ message: 'Erreur lors de la vérification du mot de passe' });
      }
      
      // Vérification du mot de passe actuel
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
      }
      
      // Hashage du nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Changement du mot de passe
      const success = await UserModel.changePassword(userId, hashedPassword);
      if (!success) {
        return res.status(500).json({ message: 'Erreur lors du changement de mot de passe' });
      }
      
      // Journalisation du changement de mot de passe
      await AccessLogModel.create({
        user_id: userId,
        action: 'PASSWORD_CHANGE',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        success: true
      });
      
      res.json({ message: 'Mot de passe modifié avec succès' });
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      res.status(500).json({ message: 'Erreur lors du changement de mot de passe' });
    }
  },

  /**
   * Demande une réinitialisation de mot de passe
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      console.log('Forgot password request for email:', email);

      // Recherche de l'utilisateur par email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        console.log('No user found for email:', email);
        return res.status(404).json({ message: 'Aucun utilisateur trouvé avec cet email' });
      }

      // Génération d'un mot de passe temporaire
      const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
      console.log('Generated temp password:', tempPassword);
      
      const hashedTempPassword = await bcrypt.hash(tempPassword, 10);

      // Mise à jour du mot de passe de l'utilisateur
      const success = await UserModel.changePassword(user.id, hashedTempPassword);
      if (!success) {
        console.error('Failed to update password for user:', user.id);
        return res.status(500).json({ message: 'Erreur lors de la mise à jour du mot de passe' });
      }

      // Envoi de l'email avec le mot de passe temporaire
      await sendEmail({
        to: user.email,
        subject: 'Votre mot de passe temporaire',
        text: `Votre mot de passe temporaire est : ${tempPassword}\n\nVeuillez vous connecter et changer votre mot de passe dès que possible.`,
        html: `
          <h2>Réinitialisation de votre mot de passe</h2>
          <p>Votre mot de passe temporaire est : <strong>${tempPassword}</strong></p>
          <p>Veuillez vous connecter et changer votre mot de passe dès que possible.</p>
          <p>Pour des raisons de sécurité, ce mot de passe est temporaire et doit être changé lors de votre prochaine connexion.</p>
        `
      });

      console.log('Sending response with temp password');
      res.json({ 
        message: 'Un mot de passe temporaire a été envoyé à votre adresse email',
        tempPassword // Envoi du mot de passe temporaire dans la réponse pour l'afficher directement
      });
    } catch (error) {
      console.error('Erreur lors de la demande de réinitialisation:', error);
      res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email de réinitialisation' });
    }
  },

  /**
   * Réinitialise le mot de passe
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      // Recherche de l'utilisateur avec le token valide
      const user = await UserModel.findByResetToken(token);
      if (!user || user.resetTokenExpiry < Date.now()) {
        return res.status(400).json({ message: 'Token invalide ou expiré' });
      }

      // Hashage du nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Mise à jour du mot de passe et suppression du token
      await UserModel.update(user.id, {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      });

      res.json({ message: 'Mot de passe réinitialisé avec succès' });
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      res.status(500).json({ message: 'Erreur lors de la réinitialisation du mot de passe' });
    }
  }
};

module.exports = AuthController;