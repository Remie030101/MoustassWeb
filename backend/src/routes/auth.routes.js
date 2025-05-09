const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth');
const { validateLogin, validatePasswordReset } = require('../middleware/validators');
const handleValidationErrors = require('../middleware/validationHandler');

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Inscription d'un nouvel utilisateur
 * @access Public
 */
router.post(
  '/register',
  [
    body('username')
      .isLength({ min: 4, max: 30 })
      .withMessage('Le nom d\'utilisateur doit contenir entre 4 et 30 caractères')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores'),
    
    body('password')
      .isLength({ min: 8 })
      .withMessage('Le mot de passe doit contenir au moins 8 caractères')
      .matches(/\d/)
      .withMessage('Le mot de passe doit contenir au moins un chiffre')
      .matches(/[A-Z]/)
      .withMessage('Le mot de passe doit contenir au moins une lettre majuscule'),
    
    body('email')
      .isEmail()
      .withMessage('Email invalide')
      .normalizeEmail(),
    
    body('full_name')
      .isLength({ min: 2, max: 100 })
      .withMessage('Le nom complet doit contenir entre 2 et 100 caractères')
  ],
  AuthController.register
);

/**
 * @route POST /api/auth/login
 * @desc Connexion d'un utilisateur
 * @access Public
 */
router.post('/login', validateLogin, AuthController.login);

/**
 * @route POST /api/auth/logout
 * @desc Déconnexion d'un utilisateur
 * @access Private
 */
router.post('/logout', authenticateToken, AuthController.logout);

/**
 * @route GET /api/auth/verify
 * @desc Vérifie si le token JWT est valide
 * @access Private
 */
router.get('/verify', authenticateToken, AuthController.verifyToken);

/**
 * @route POST /api/auth/change-password
 * @desc Change le mot de passe d'un utilisateur
 * @access Private
 */
router.post(
  '/change-password',
  authenticateToken,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Mot de passe actuel requis'),
    
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial')
  ],
  handleValidationErrors,
  AuthController.changePassword
);

/**
 * Route de demande de réinitialisation de mot de passe
 * @route POST /api/auth/forgot-password
 */
router.post('/forgot-password', AuthController.forgotPassword);

/**
 * Route de réinitialisation de mot de passe
 * @route POST /api/auth/reset-password
 */
router.post('/reset-password', validatePasswordReset, AuthController.resetPassword);

module.exports = router;