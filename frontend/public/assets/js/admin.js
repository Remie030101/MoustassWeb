/**
 * Service de gestion des utilisateurs pour l'administration
 */
const adminService = {
    /**
     * Récupère la liste des utilisateurs
     * @returns {Promise<Array>} Liste des utilisateurs
     */
    async getUsers() {
        try {
            const response = await api.get('/admin/users');
            return Array.isArray(response) ? response : response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des utilisateurs:', error);
            throw error;
        }
    },

    /**
     * Crée un nouvel utilisateur
     * @param {Object} userData - Données de l'utilisateur
     * @returns {Promise<Object>} Utilisateur créé
     */
    async createUser(userData) {
        try {
            const response = await api.post('/admin/users', userData);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la création de l\'utilisateur:', error);
            throw error;
        }
    },

    /**
     * Met à jour un utilisateur
     * @param {number} userId - ID de l'utilisateur
     * @param {Object} userData - Données à mettre à jour
     * @returns {Promise<Object>} Utilisateur mis à jour
     */
    async updateUser(userId, userData) {
        try {
            const response = await api.put(`/admin/users/${userId}`, userData);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
            throw error;
        }
    },

    /**
     * Supprime un utilisateur
     * @param {number} userId - ID de l'utilisateur
     * @returns {Promise<Object>} Résultat de la suppression
     */
    async deleteUser(userId) {
        try {
            const response = await api.delete(`/admin/users/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'utilisateur:', error);
            throw error;
        }
    }
};

/**
 * Gestionnaire de la page d'administration
 */
const adminPage = {
    /**
     * Initialise la page d'administration
     */
    init() {
        this.loadUsers();
        this.setupEventListeners();
    },

    /**
     * Charge la liste des utilisateurs
     */
    async loadUsers() {
        try {
            const users = await adminService.getUsers();
            this.renderUsers(users);
        } catch (error) {
            utils.showError('Erreur lors du chargement des utilisateurs');
        }
    },

    /**
     * Affiche la liste des utilisateurs
     * @param {Array} users - Liste des utilisateurs
     */
    renderUsers(users) {
        const usersList = document.getElementById('users-list');
        usersList.innerHTML = '';

        users.forEach(user => {
            const template = document.getElementById('user-item-template');
            const userElement = template.content.cloneNode(true);
            
            const userItem = userElement.querySelector('.user-item');
            userItem.dataset.id = user.id;
            
            userElement.querySelector('.user-name').textContent = user.full_name;
            userElement.querySelector('.user-email').textContent = user.email;
            userElement.querySelector('.user-role').textContent = user.role;
            
            usersList.appendChild(userElement);
        });
    },

    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        // Bouton nouveau utilisateur
        document.getElementById('new-user-btn').addEventListener('click', () => {
            this.showUserForm();
        });

        // Formulaire utilisateur
        document.getElementById('user-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleUserFormSubmit();
        });

        // Bouton annuler
        document.getElementById('cancel-user-form').addEventListener('click', () => {
            this.hideUserForm();
        });

        // Recherche d'utilisateurs
        document.getElementById('user-search').addEventListener('input', (e) => {
            this.filterUsers(e.target.value);
        });

        // Filtre par rôle
        document.getElementById('role-filter').addEventListener('change', (e) => {
            this.filterUsersByRole(e.target.value);
        });

        // Délégation d'événements pour les actions sur les utilisateurs
        document.getElementById('users-list').addEventListener('click', (e) => {
            const userItem = e.target.closest('.user-item');
            if (!userItem) return;

            const userId = userItem.dataset.id;

            if (e.target.closest('.user-edit')) {
                this.editUser(userId);
            } else if (e.target.closest('.user-delete')) {
                this.deleteUser(userId);
            }
        });
    },

    /**
     * Affiche le formulaire utilisateur
     * @param {Object} user - Données de l'utilisateur (optionnel)
     */
    showUserForm(user = null) {
        const form = document.getElementById('user-form');
        const container = document.getElementById('user-form-container');
        
        if (user) {
            form.elements['user-id'].value = user.id;
            form.elements['username'].value = user.username;
            form.elements['email'].value = user.email;
            form.elements['full_name'].value = user.full_name;
            form.elements['role'].value = user.role;
            form.elements['password'].value = '';
        } else {
            form.reset();
            form.elements['user-id'].value = '';
        }
        
        container.style.display = 'block';
    },

    /**
     * Cache le formulaire utilisateur
     */
    hideUserForm() {
        document.getElementById('user-form-container').style.display = 'none';
    },

    /**
     * Gère la soumission du formulaire utilisateur
     */
    async handleUserFormSubmit() {
        const form = document.getElementById('user-form');
        const formData = new FormData(form);
        const userData = Object.fromEntries(formData.entries());
        const userId = formData.get('user-id');

        try {
            if (userId) {
                await adminService.updateUser(userId, userData);
                utils.showSuccess('Utilisateur mis à jour avec succès');
            } else {
                await adminService.createUser(userData);
                utils.showSuccess('Utilisateur créé avec succès');
            }

            this.hideUserForm();
            this.loadUsers();
        } catch (error) {
            utils.showError('Erreur lors de l\'enregistrement de l\'utilisateur');
        }
    },

    /**
     * Modifie un utilisateur
     * @param {number} userId - ID de l'utilisateur
     */
    async editUser(userId) {
        try {
            const users = await adminService.getUsers();
            const user = users.find(u => u.id === userId);
            if (user) {
                this.showUserForm(user);
            }
        } catch (error) {
            utils.showError('Erreur lors du chargement des données de l\'utilisateur');
        }
    },

    /**
     * Supprime un utilisateur
     * @param {number} userId - ID de l'utilisateur
     */
    async deleteUser(userId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            try {
                await adminService.deleteUser(userId);
                utils.showSuccess('Utilisateur supprimé avec succès');
                this.loadUsers();
            } catch (error) {
                utils.showError('Erreur lors de la suppression de l\'utilisateur');
            }
        }
    },

    /**
     * Filtre les utilisateurs par recherche
     * @param {string} searchTerm - Terme de recherche
     */
    filterUsers(searchTerm) {
        const users = document.querySelectorAll('.user-item');
        const searchLower = searchTerm.toLowerCase();

        users.forEach(user => {
            const name = user.querySelector('.user-name').textContent.toLowerCase();
            const email = user.querySelector('.user-email').textContent.toLowerCase();
            
            if (name.includes(searchLower) || email.includes(searchLower)) {
                user.style.display = '';
            } else {
                user.style.display = 'none';
            }
        });
    },

    /**
     * Filtre les utilisateurs par rôle
     * @param {string} role - Rôle à filtrer
     */
    filterUsersByRole(role) {
        const users = document.querySelectorAll('.user-item');

        users.forEach(user => {
            const userRole = user.querySelector('.user-role').textContent;
            
            if (!role || userRole === role) {
                user.style.display = '';
            } else {
                user.style.display = 'none';
            }
        });
    }
}; 