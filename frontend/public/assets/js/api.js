/**
 * Service de gestion des requêtes API
 */
const api = {
    /**
     * Récupère le token JWT depuis le localStorage
     * @returns {string|null} Le token ou null si non disponible
     */
    getToken() {
      return localStorage.getItem(config.tokenKey);
    },
  
    /**
     * Enregistre le token JWT dans le localStorage
     * @param {string} token - Le token JWT
     */
    setToken(token) {
      localStorage.setItem(config.tokenKey, token);
    },
  
    /**
     * Supprime le token JWT du localStorage
     */
    removeToken() {
      localStorage.removeItem(config.tokenKey);
    },
  
    /**
     * Vérifie si l'utilisateur est connecté
     * @returns {boolean} Vrai si l'utilisateur est connecté
     */
    isAuthenticated() {
      const token = this.getToken();
      if (!token) return false;
  
      // Vérification basique de l'expiration du token
      try {
        // Le token JWT est composé de 3 parties séparées par des points
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 > Date.now();
      } catch (error) {
        console.error('Erreur lors de la vérification du token', error);
        return false;
      }
    },
  
    /**
     * Effectue une requête API
     * @param {string} endpoint - L'endpoint de l'API
     * @param {Object} options - Options de la requête fetch
     * @returns {Promise<Object>} Réponse de l'API
     */
    async request(endpoint, options = {}) {
      // Construction de l'URL complète
      const url = `${config.apiUrl}${endpoint}`;
  
      // Configuration par défaut de la requête
      const defaultOptions = {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: config.apiTimeout
      };
  
      // Si un token existe et que l'utilisateur est authentifié, on l'ajoute aux headers
      if (this.isAuthenticated()) {
        defaultOptions.headers['Authorization'] = `Bearer ${this.getToken()}`;
      }
  
      // Fusion des options
      const fetchOptions = {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers
        }
      };
  
      try {
        // Gestion du timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.apiTimeout);
        fetchOptions.signal = controller.signal;
  
        // Exécution de la requête
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);
  
        // Parsing de la réponse JSON
        const data = await response.json();
  
        // Gestion des erreurs HTTP
        if (!response.ok) {
          throw {
            status: response.status,
            message: data.message || 'Une erreur s\'est produite',
            details: data.errors || []
          };
        }
  
        return data;
      } catch (error) {
        // Gestion des erreurs de timeout
        if (error.name === 'AbortError') {
          throw {
            status: 408,
            message: 'La requête a expiré'
          };
        }
  
        // Propagation des erreurs
        throw error;
      }
    },
  
    /**
     * Effectue une requête GET
     * @param {string} endpoint - L'endpoint de l'API
     * @param {Object} params - Paramètres de requête
     * @returns {Promise<Object>} Réponse de l'API
     */
    async get(endpoint, params = {}) {
      // Construction des paramètres d'URL
      const queryParams = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
  
      const url = queryParams ? `${endpoint}?${queryParams}` : endpoint;
  
      return this.request(url, { method: 'GET' });
    },
  
    /**
     * Effectue une requête POST
     * @param {string} endpoint - L'endpoint de l'API
     * @param {Object} data - Données à envoyer
     * @returns {Promise<Object>} Réponse de l'API
     */
    async post(endpoint, data = {}) {
      return this.request(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
  
    /**
     * Effectue une requête PUT
     * @param {string} endpoint - L'endpoint de l'API
     * @param {Object} data - Données à envoyer
     * @returns {Promise<Object>} Réponse de l'API
     */
    async put(endpoint, data = {}) {
      return this.request(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
  
    /**
     * Effectue une requête DELETE
     * @param {string} endpoint - L'endpoint de l'API
     * @returns {Promise<Object>} Réponse de l'API
     */
    async delete(endpoint) {
      return this.request(endpoint, { method: 'DELETE' });
    }
  };