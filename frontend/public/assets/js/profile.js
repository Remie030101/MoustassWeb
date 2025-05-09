/**
 * Service de gestion du profil utilisateur
 */
const profileService = {
    /**
     * Récupère le profil de l'utilisateur
     * @returns {Promise<Object>} Réponse de l'API
     */
    async getUserProfile() {
      try {
        return await api.get('/users/profile');
      } catch (error) {
        console.error('Erreur lors de la récupération du profil', error);
        throw error;
      }
    },
  
    /**
     * Met à jour le profil de l'utilisateur
     * @param {Object} data - Données à mettre à jour
     * @returns {Promise<Object>} Réponse de l'API
     */
    async updateUserProfile(data) {
      try {
        return await api.put('/users/profile', data);
      } catch (error) {
        console.error('Erreur lors de la mise à jour du profil', error);
        throw error;
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
        return await authService.changePassword(currentPassword, newPassword);
      } catch (error) {
        console.error('Erreur lors du changement de mot de passe', error);
        throw error;
      }
    },
  
    /**
     * Charge les informations du profil utilisateur
     */
    async loadUserProfile() {
      try {
        const profileForm = document.getElementById('profile-form');
        const usernameField = document.getElementById('profile-username');
        const emailField = document.getElementById('profile-email');
        const fullnameField = document.getElementById('profile-fullname');
        const profileError = document.getElementById('profile-error');
        
        if (!profileForm) return;
        
        // Récupération du profil
        const profile = await this.getUserProfile();
        
        // Remplissage des champs
        if (usernameField) usernameField.value = profile.username;
        if (emailField) emailField.value = profile.email;
        if (fullnameField) fullnameField.value = profile.full_name;
        
        // Gestion du formulaire
        profileForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          try {
            if (profileError) profileError.textContent = '';
            
            const formData = new FormData(profileForm);
            const updateData = {
              email: formData.get('email'),
              full_name: formData.get('full_name')
            };
            
            // Mise à jour du profil
            const response = await this.updateUserProfile(updateData);
            
            // Mise à jour des informations utilisateur
            const currentUser = authService.getCurrentUser();
            currentUser.email = updateData.email;
            currentUser.full_name = updateData.full_name;
            authService.setCurrentUser(currentUser);
            
            // Mise à jour du nom dans l'en-tête
            const userFullname = document.getElementById('user-fullname');
            if (userFullname) {
              userFullname.textContent = currentUser.full_name;
            }
            
            // Notification
            utils.showNotification('Profil mis à jour avec succès', 'success');
          } catch (error) {
            console.error('Erreur lors de la mise à jour du profil', error);
            
            if (profileError) {
              profileError.textContent = error.message || 'Erreur lors de la mise à jour du profil';
            }
          }
        });
        
        // Initialisation du formulaire de mot de passe
        this.initPasswordForm();
      } catch (error) {
        console.error('Erreur lors du chargement du profil', error);
        utils.showNotification('Erreur lors du chargement du profil', 'error');
      }
    },
  
    /**
     * Initialise le formulaire de changement de mot de passe
     */
    initPasswordForm() {
      const passwordForm = document.getElementById('password-form');
      const passwordError = document.getElementById('password-error');
      
      if (!passwordForm) return;
      
      passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
          if (passwordError) passwordError.textContent = '';
          
          const formData = new FormData(passwordForm);
          const currentPassword = formData.get('currentPassword');
          const newPassword = formData.get('newPassword');
          const confirmNewPassword = formData.get('confirmNewPassword');
          
          // Vérification de la confirmation
          if (newPassword !== confirmNewPassword) {
            if (passwordError) {
              passwordError.textContent = 'Les mots de passe ne correspondent pas';
            }
            return;
          }
          
          // Vérification de la complexité
          const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
          if (!passwordRegex.test(newPassword)) {
            if (passwordError) {
              passwordError.textContent = 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial';
            }
            return;
          }
          
          // Changement du mot de passe
          await this.changePassword(currentPassword, newPassword);
          
          // Réinitialisation du formulaire
          passwordForm.reset();
          
          // Notification
          utils.showNotification('Mot de passe changé avec succès', 'success');
        } catch (error) {
          console.error('Erreur lors du changement de mot de passe', error);
          
          if (passwordError) {
            if (error.status === 401) {
              passwordError.textContent = 'Mot de passe actuel incorrect';
            } else {
              passwordError.textContent = error.message || 'Erreur lors du changement de mot de passe';
            }
          }
        }
      });
    }
  };