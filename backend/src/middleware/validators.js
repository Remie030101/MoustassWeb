const { body } = require('express-validator');

/**
 * Validateur pour la connexion
 */
const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('Le nom d\'utilisateur est requis'),
  
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis'),
  
  body('loginType')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Le type de connexion doit être "user" ou "admin"')
];

/**
 * Validateur pour la réinitialisation de mot de passe
 */
const validatePasswordReset = [
  body('token')
    .notEmpty()
    .withMessage('Le token est requis'),
  
  body('newPassword')
    .notEmpty()
    .withMessage('Le nouveau mot de passe est requis')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial')
];

/**
 * Validateur pour les utilisateurs
 */
const validateUser = [
  body('username')
    .notEmpty()
    .withMessage('Le nom d\'utilisateur est requis')
    .isLength({ min: 3 })
    .withMessage('Le nom d\'utilisateur doit contenir au moins 3 caractères'),
  
  body('email')
    .notEmpty()
    .withMessage('L\'email est requis')
    .isEmail()
    .withMessage('L\'email doit être valide'),
  
  body('full_name')
    .notEmpty()
    .withMessage('Le nom complet est requis'),
  
  body('role')
    .notEmpty()
    .withMessage('Le rôle est requis')
    .isIn(['user', 'admin'])
    .withMessage('Le rôle doit être "user" ou "admin"'),
  
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial')
];

module.exports = {
  validateLogin,
  validatePasswordReset,
  validateUser
}; 