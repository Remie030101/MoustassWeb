const express = require('express');
const { body } = require('express-validator');
const UserController = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

/**
 * @route GET /api/users/profile
 * @desc Récupère le profil de l'utilisateur connecté
 * @access Private
 */
router.get('/profile', UserController.getProfile);

/**
 * @route PUT /api/users/profile
 * @desc Met à jour le profil de l'utilisateur
 * @access Private
 */
router.put(
  '/profile',
  [
    body('email')
      .optional()
      .isEmail()
      .withMessage('Email invalide')
      .normalizeEmail(),
    
    body('full_name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Le nom complet doit contenir entre 2 et 100 caractères')
  ],
  UserController.updateProfile
);

/**
 * @route GET /api/users/:id
 * @desc Récupère un utilisateur par son ID
 * @access Private
 */
router.get('/:id', UserController.getUser);

module.exports = router;
