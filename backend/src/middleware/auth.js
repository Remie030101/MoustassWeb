const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');

/**
 * Middleware pour vérifier le token JWT
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token d\'authentification manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    return res.status(401).json({ message: 'Token invalide' });
  }
};

/**
 * Middleware pour vérifier les rôles utilisateur
 */
function checkRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }

    const userRole = req.user.role;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        message: 'Autorisation insuffisante pour accéder à cette ressource.' 
      });
    }
    
    next();
  };
}

const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    next();
  } catch (error) {
    console.error('Erreur de vérification du rôle admin:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  authenticateToken,
  checkRole,
  isAdmin
};