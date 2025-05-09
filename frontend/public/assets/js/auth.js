/**
 * Service de gestion de l'authentification
 */
const authService = {
    /**
     * Stocke les informations de l'utilisateur connecté
     * @param {Object} user - Données utilisateur
     */
    setCurrentUser(user) {
      localStorage.setItem(config.userKey, JSON.stringify(user));
    },
  
    /**
     * Récupère les informations de l'utilisateur connecté
     * @returns {Object|null} Données utilisateur ou null si non disponible
     */
    getCurrentUser() {
      const userData = localStorage.getItem(config.userKey);
      return userData ? JSON.parse(userData) : null;
    },
  
    /**
     * Supprime les informations de l'utilisateur
     */
    clearCurrentUser() {
      localStorage.removeItem(config.userKey);
    },
  
    /**
     * Connecte un utilisateur
     * @param {string} username - Nom d'utilisateur
     * @param {string} password - Mot de passe
     * @param {string} loginType - Type de connexion (user/admin)
     * @returns {Promise<Object>} Réponse de l'API
     */
    async login(username, password, loginType) {
      try {
        const response = await api.post('/auth/login', { username, password, loginType });
        
        // Stockage du token et des informations utilisateur
        api.setToken(response.token);
        this.setCurrentUser(response.user);
        
        return response;
      } catch (error) {
        console.error('Erreur de connexion', error);
        throw error;
      }
    },
  
    /**
     * Inscrit un nouvel utilisateur
     * @param {Object} userData - Données d'inscription
     * @returns {Promise<Object>} Réponse de l'API
     */
    async register(userData) {
      try {
        return await api.post('/auth/register', userData);
      } catch (error) {
        console.error('Erreur d\'inscription', error);
        throw error;
      }
    },
  
    /**
     * Déconnecte l'utilisateur
     * @returns {Promise<Object>} Réponse de l'API
     */
    async logout() {
      try {
        // Appel API de déconnexion
        await api.post('/auth/logout');
      } catch (error) {
        console.error('Erreur lors de la déconnexion', error);
      } finally {
        // Suppression des données locales même en cas d'erreur
        api.removeToken();
        this.clearCurrentUser();
      }
    },
  
    /**
     * Change le mot de passe de l'utilisateur
     * @param {string} currentPassword - Mot de passe actuel
     * @param {string} newPassword - Nouveau mot de passe
     * @returns {Promise<Object>} Réponse de l'API
     */
    async changePassword(currentPassword, newPassword) {
      try {
        return await api.post('/auth/change-password', {
          currentPassword,
          newPassword
        });
      } catch (error) {
        console.error('Erreur lors du changement de mot de passe', error);
        throw error;
      }
    },
  
    /**
     * Vérifie la validité du token
     * @returns {Promise<boolean>} Vrai si le token est valide
     */
    async verifyToken() {
      try {
        if (!api.isAuthenticated()) {
          return false;
        }
        
        // Appel API pour vérifier le token
        const response = await api.get('/auth/verify');
        return response.valid === true;
      } catch (error) {
        console.error('Token invalide', error);
        return false;
      }
    },

    /**
     * Demande une réinitialisation de mot de passe
     * @param {string} email - Email de l'utilisateur
     * @returns {Promise<Object>} Réponse de l'API
     */
    async requestPasswordReset(email) {
      try {
        return await api.post('/auth/forgot-password', { email });
      } catch (error) {
        console.error('Erreur lors de la demande de réinitialisation', error);
        throw error;
      }
    },

    /**
     * Réinitialise le mot de passe
     * @param {string} token - Token de réinitialisation
     * @param {string} newPassword - Nouveau mot de passe
     * @returns {Promise<Object>} Réponse de l'API
     */
    async resetPassword(token, newPassword) {
      try {
        return await api.post('/auth/reset-password', { token, newPassword });
      } catch (error) {
        console.error('Erreur lors de la réinitialisation du mot de passe', error);
        throw error;
      }
    },

    /**
     * Gère la soumission du formulaire de mot de passe oublié
     * @param {Event} event - Événement de soumission du formulaire
     */
    async handleForgotPassword(event) {
      event.preventDefault();
      console.log('handleForgotPassword called');
      
      const email = document.getElementById('forgot-email').value;
      const errorElement = document.getElementById('forgot-password-error');
      
      try {
        console.log('Sending request for email:', email);
        const response = await this.requestPasswordReset(email);
        console.log('Response received:', response);
        
        if (!response.tempPassword) {
          throw new Error('Le mot de passe temporaire n\'a pas été reçu');
        }
        
        // Création et affichage du popup
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
          <div class="modal-content">
            <h3>Mot de passe temporaire</h3>
            <p>Votre mot de passe temporaire est : <strong>${response.tempPassword}</strong></p>
            <p>Veuillez le noter et le changer lors de votre prochaine connexion.</p>
            <button class="btn btn-primary" onclick="this.closest('.modal').remove()">Fermer</button>
          </div>
        `;
        document.body.appendChild(modal);
        
        // Redirection vers la page de connexion après 5 secondes
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 5000);
        
      } catch (error) {
        console.error('Error in handleForgotPassword:', error);
        if (errorElement) {
          errorElement.textContent = error.response?.data?.message || 'Erreur lors de la réinitialisation du mot de passe';
        }
      }
    }
  };