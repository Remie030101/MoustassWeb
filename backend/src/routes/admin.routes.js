const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { validateUser } = require('../middleware/validators');
const handleValidationErrors = require('../middleware/validationHandler');

/**
 * @route GET /api/admin/users
 * @desc Récupère la liste des utilisateurs
 * @access Admin
 */
router.get('/users', authenticateToken, isAdmin, AdminController.getUsers);

/**
 * @route GET /api/admin/users/:id
 * @desc Récupère un utilisateur par son ID
 * @access Admin
 */
router.get('/users/:id', authenticateToken, isAdmin, AdminController.getUserById);

/**
 * @route POST /api/admin/users
 * @desc Crée un nouvel utilisateur
 * @access Admin
 */
router.post('/users', authenticateToken, isAdmin, validateUser, handleValidationErrors, AdminController.createUser);

/**
 * @route PUT /api/admin/users/:id
 * @desc Met à jour un utilisateur
 * @access Admin
 */
router.put('/users/:id', authenticateToken, isAdmin, validateUser, handleValidationErrors, AdminController.updateUser);

/**
 * @route DELETE /api/admin/users/:id
 * @desc Supprime un utilisateur
 * @access Admin
 */
router.delete('/users/:id', authenticateToken, isAdmin, AdminController.deleteUser);

module.exports = router; 