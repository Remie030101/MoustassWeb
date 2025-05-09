const db = require('./db');
const security = require('../utils/security');

/**
 * Modèle pour gérer les utilisateurs
 */
const UserModel = {
  /**
   * Crée un nouvel utilisateur
   * @param {Object} userData - Données utilisateur
   * @returns {Promise<Object>} - Utilisateur créé
   */
  create: async (userData) => {
    const { username, password, email, full_name, role = 'user' } = userData;
    
    // Hachage du mot de passe
    const password_hash = await security.hashPassword(password);
    
    const query = `
      INSERT INTO users (username, password_hash, email, full_name, role)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const result = await db.query(query, [username, password_hash, email, full_name, role]);
    
    return {
      id: result.insertId,
      username,
      email,
      full_name,
      role
    };
  },
  
  /**
   * Trouve un utilisateur par son identifiant
   * @param {number} id - Identifiant utilisateur
   * @returns {Promise<Object|null>} - Utilisateur trouvé ou null
   */
  findById: async (id) => {
    const query = `
      SELECT id, username, password_hash, email, full_name, role, created_at, last_login, is_active
      FROM users
      WHERE id = ?
    `;
    
    const users = await db.query(query, [id]);
    
    return users.length ? users[0] : null;
  },
  
  /**
   * Trouve un utilisateur par son nom d'utilisateur
   * @param {string} username - Nom d'utilisateur
   * @returns {Promise<Object|null>} - Utilisateur trouvé ou null
   */
  findByUsername: async (username) => {
    const query = `
      SELECT id, username, password_hash, email, full_name, role, created_at, last_login, is_active
      FROM users
      WHERE username = ?
    `;
    
    const users = await db.query(query, [username]);
    
    return users.length ? users[0] : null;
  },
  
  /**
   * Vérifie si un utilisateur existe déjà
   * @param {string} username - Nom d'utilisateur
   * @param {string} email - Email
   * @returns {Promise<boolean>} - Vrai si l'utilisateur existe
   */
  exists: async (username, email) => {
    const query = `
      SELECT COUNT(*) as count
      FROM users
      WHERE username = ? OR email = ?
    `;
    
    const result = await db.query(query, [username, email]);
    
    return result[0].count > 0;
  },
  
  /**
   * Liste tous les utilisateurs avec pagination
   * @param {number} limit - Nombre d'utilisateurs par page
   * @param {number} offset - Décalage pour la pagination
   * @returns {Promise<Array>} - Liste d'utilisateurs
   */
  findAll: async (limit = 10, offset = 0) => {
    const query = `
      SELECT id, username, email, full_name, role, created_at, last_login, is_active
      FROM users
      ORDER BY id
      LIMIT ? OFFSET ?
    `;
    
    return await db.query(query, [limit, offset]);
  },
  
  /**
   * Met à jour un utilisateur
   * @param {number} id - Identifiant utilisateur
   * @param {Object} userData - Données à mettre à jour
   * @returns {Promise<boolean>} - Vrai si mise à jour réussie
   */
  update: async (id, userData) => {
    const { email, full_name, role, password } = userData;
    
    let query, params;
    
    if (password) {
      // Si un nouveau mot de passe est fourni, le hasher
      const password_hash = await security.hashPassword(password);
      query = `
        UPDATE users
        SET email = ?, full_name = ?, role = ?, password_hash = ?
        WHERE id = ?
      `;
      params = [email, full_name, role, password_hash, id];
    } else {
      query = `
        UPDATE users
        SET email = ?, full_name = ?, role = ?
        WHERE id = ?
      `;
      params = [email, full_name, role, id];
    }
    
    const result = await db.query(query, params);
    
    return result.affectedRows > 0;
  },
  
  /**
   * Change le mot de passe d'un utilisateur
   * @param {number} id - Identifiant utilisateur
   * @param {string} hashedPassword - Mot de passe hashé
   * @returns {Promise<boolean>} - Vrai si changement réussi
   */
  changePassword: async (id, hashedPassword) => {
    const query = `
      UPDATE users
      SET password_hash = ?
      WHERE id = ?
    `;
    
    const result = await db.query(query, [hashedPassword, id]);
    
    return result.affectedRows > 0;
  },
  
  /**
   * Supprime un utilisateur
   * @param {number} id - Identifiant utilisateur
   * @returns {Promise<boolean>} - Vrai si suppression réussie
   */
  delete: async (id) => {
    const query = `
      DELETE FROM users
      WHERE id = ?
    `;
    
    const result = await db.query(query, [id]);
    
    return result.affectedRows > 0;
  },
  
  /**
   * Met à jour la date de dernière connexion
   * @param {number} id - Identifiant utilisateur
   * @returns {Promise<boolean>} - Vrai si mise à jour réussie
   */
  updateLastLogin: async (id) => {
    const query = `
      UPDATE users
      SET last_login = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const result = await db.query(query, [id]);
    
    return result.affectedRows > 0;
  },

  /**
   * Recherche un utilisateur par son email
   * @param {string} email - Email de l'utilisateur
   * @returns {Promise<Object>} Utilisateur trouvé
   */
  async findByEmail(email) {
    const query = `
      SELECT id, username, password_hash, email, full_name, role, created_at, last_login, is_active
      FROM users
      WHERE email = ?
    `;
    
    const users = await db.query(query, [email]);
    
    return users.length ? users[0] : null;
  },

  /**
   * Recherche un utilisateur par son token de réinitialisation
   * @param {string} token - Token de réinitialisation
   * @returns {Promise<Object>} Utilisateur trouvé
   */
  async findByResetToken(token) {
    const query = `
      SELECT id, username, password_hash, email, full_name, role, created_at, last_login, is_active
      FROM users
      WHERE reset_token = ? AND reset_token_expiry > NOW()
    `;
    
    const users = await db.query(query, [token]);
    
    return users.length ? users[0] : null;
  },

  /**
   * Met à jour un utilisateur
   * @param {number} id - ID de l'utilisateur
   * @param {Object} data - Données à mettre à jour
   * @returns {Promise<Object>} Résultat de la mise à jour
   */
  async update(id, data) {
    const allowedFields = ['email', 'full_name', 'role', 'is_active'];
    const fields = [];
    const values = [];
    
    // Construction dynamique de la requête
    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (fields.length === 0) {
      return false;
    }
    
    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = ?
    `;
    
    values.push(id);
    
    const result = await db.query(query, values);
    
    return result.affectedRows > 0;
  },

  /**
   * Récupère tous les utilisateurs
   * @returns {Promise<Array>} Liste des utilisateurs
   */
  async findAll() {
    const query = `
      SELECT id, username, email, full_name, role, created_at, last_login, is_active
      FROM users
    `;
    
    return await db.query(query);
  }
};

module.exports = UserModel;