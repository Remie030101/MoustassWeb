/**
 * Application principale Moustass Web
 */
const app = {
    /**
     * Initialise l'application
     */
    async init() {
      // Masquage du chargement initial
      document.getElementById('loading').style.display = 'none';
      
      // Vérification de l'authentification
      if (api.isAuthenticated()) {
        // Vérification du token
        const isValid = await authService.verifyToken();
        
        if (isValid) {
          this.loadDashboard();
        } else {
          // Token invalide ou expiré
          api.removeToken();
          authService.clearCurrentUser();
          this.loadLoginPage();
        }
      } else {
        this.loadLoginPage();
      }
      
      // Initialisation de la modal
      this.initModal();

      // Initialisation des événements de la page
      this.initEvents();
    },
  
    /**
     * Initialise la modal
     */
    initModal() {
      const modal = document.getElementById('modal-container');
      const closeButtons = modal.querySelectorAll('.modal-close');
      
      // Fermeture par les boutons
      closeButtons.forEach(button => {
        button.addEventListener('click', () => {
          modal.style.display = 'none';
        });
      });
      
      // Fermeture par clic en dehors
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      });
    },
  
    /**
     * Charge la page de connexion
     */
    loadLoginPage() {
      // Récupération du template
      const template = document.getElementById('login-template');
      const appContainer = document.getElementById('app');
      
      // Remplacement du contenu
      appContainer.innerHTML = '';
      appContainer.appendChild(document.importNode(template.content, true));
      
      // Gestion du formulaire de connexion
      const loginForm = document.getElementById('login-form');
      const loginError = document.getElementById('login-error');
      const registerLink = document.getElementById('register-link');
      
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
          if (loginError) loginError.textContent = '';
          
          const formData = new FormData(loginForm);
          const username = formData.get('username');
          const password = formData.get('password');
          const loginType = formData.get('login-type');
          
          // Tentative de connexion
          await authService.login(username, password, loginType);
          
          // Redirection vers le tableau de bord approprié
          const user = authService.getCurrentUser();
          if (user.role === 'admin' && loginType === 'admin') {
            this.loadAdminDashboard();
          } else {
            this.loadDashboard();
          }
        } catch (error) {
          console.error('Erreur de connexion', error);
          
          if (loginError) {
            if (error.status === 401) {
              loginError.textContent = 'Nom d\'utilisateur ou mot de passe incorrect';
            } else {
              loginError.textContent = error.message || 'Erreur lors de la connexion';
            }
          }
        }
      });
      
      // Lien vers l'inscription
      registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadRegisterPage();
      });
    },
  
    /**
     * Charge la page d'inscription
     */
    loadRegisterPage() {
      // Récupération du template
      const template = document.getElementById('register-template');
      const appContainer = document.getElementById('app');
      
      // Remplacement du contenu
      appContainer.innerHTML = '';
      appContainer.appendChild(document.importNode(template.content, true));
      
      // Gestion du formulaire d'inscription
      const registerForm = document.getElementById('register-form');
      const registerError = document.getElementById('register-error');
      const loginLink = document.getElementById('login-link');
      
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
          if (registerError) registerError.textContent = '';
          
          const formData = new FormData(registerForm);
          const username = formData.get('username');
          const email = formData.get('email');
          const fullName = formData.get('full_name');
          const password = formData.get('password');
          const confirmPassword = formData.get('confirm_password');
          
          // Vérification de la confirmation
          if (password !== confirmPassword) {
            if (registerError) {
              registerError.textContent = 'Les mots de passe ne correspondent pas';
            }
            return;
          }
          
          // Vérification de la complexité
          if (password.length < 8) {
            if (registerError) {
              registerError.textContent = 'Le mot de passe doit contenir au moins 8 caractères';
            }
            return;
          }
          
          // Tentative d'inscription
          await authService.register({
            username,
            email,
            full_name: fullName,
            password
          });
          
          // Notification
          utils.showNotification('Inscription réussie. Vous pouvez maintenant vous connecter.', 'success');
          
          // Redirection vers la page de connexion
          this.loadLoginPage();
        } catch (error) {
          console.error('Erreur d\'inscription', error);
          
          if (registerError) {
            if (error.status === 409) {
              registerError.textContent = 'Ce nom d\'utilisateur ou cet email est déjà utilisé';
            } else {
              registerError.textContent = error.message || 'Erreur lors de l\'inscription';
            }
          }
        }
      });
      
      // Lien vers la connexion
      loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadLoginPage();
      });
    },
  
    /**
     * Charge le tableau de bord
     */
    loadDashboard() {
      // Récupération du template
      const template = document.getElementById('dashboard-template');
      const appContainer = document.getElementById('app');
      
      // Remplacement du contenu
      appContainer.innerHTML = '';
      appContainer.appendChild(document.importNode(template.content, true));
      
      // Récupération de l'utilisateur
      const user = authService.getCurrentUser();
      
      // Affichage du nom d'utilisateur
      const userFullname = document.getElementById('user-fullname');
      if (userFullname && user) {
        userFullname.textContent = user.full_name;
      }
      
      // Gestion du bouton de déconnexion
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          try {
            await authService.logout();
            this.loadLoginPage();
          } catch (error) {
            console.error('Erreur lors de la déconnexion', error);
            utils.showNotification('Erreur lors de la déconnexion', 'error');
          }
        });
      }
      
      // Gestion du menu
      const menuItems = document.querySelectorAll('.menu-item');
      menuItems.forEach(item => {
        item.addEventListener('click', () => {
          // Mise à jour de la classe active
          menuItems.forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          
          // Chargement de la page correspondante
          const page = item.getAttribute('data-page');
          this.loadPage(page);
        });
      });
      
      // Chargement de la page par défaut (audio)
      this.loadPage('audio');
    },
  
    /**
     * Charge une page spécifique
     * @param {string} page - Nom de la page
     */
    loadPage(page) {
      const pageContent = document.getElementById('page-content');
      if (!pageContent) return;
      
      // Chargement de la page en fonction du nom
      switch (page) {
        case 'audio':
          this.loadAudioPage(pageContent);
          break;
        case 'financial':
          this.loadFinancialPage(pageContent);
          break;
        case 'profile':
          this.loadProfilePage(pageContent);
          break;
        default:
          pageContent.innerHTML = '<div class="error-message">Page non trouvée</div>';
      }
    },
  
    /**
     * Charge la page des enregistrements audio
     * @param {HTMLElement} container - Conteneur de la page
     */
    async loadAudioPage(container) {
      // Récupération du template
      const template = document.getElementById('audio-page-template');
      
      // Remplacement du contenu
      container.innerHTML = '';
      container.appendChild(document.importNode(template.content, true));
      
      // Vérification de l'authentification
      const user = await authService.getCurrentUser();
      if (!user) {
        utils.showNotification('Veuillez vous connecter pour accéder à cette fonctionnalité', 'warning');
        return;
      }

      // Gestion du bouton Nouvel Enregistrement
      const newAudioBtn = document.getElementById('new-audio-btn');
      const audioRecorder = document.getElementById('audio-recorder');
      const recorderSave = document.getElementById('recorder-save');
      const startRecordingBtn = document.getElementById('start-recording');
      const stopRecordingBtn = document.getElementById('stop-recording');
      const saveRecordingBtn = document.getElementById('save-recording');
      const cancelRecordingBtn = document.getElementById('cancel-recording');
      
      // Initialisation de l'enregistreur audio
      const recorderInitialized = await audioService.initRecorder();
      
      if (!recorderInitialized) {
        utils.showNotification('Erreur lors de l\'initialisation de l\'enregistreur audio', 'error');
        if (newAudioBtn) {
          newAudioBtn.disabled = true;
        }
      }
      
      // Affichage du formulaire d'enregistrement
      if (newAudioBtn && audioRecorder) {
        newAudioBtn.addEventListener('click', () => {
          audioRecorder.style.display = 'block';
          recorderSave.style.display = 'none';
          document.getElementById('recording-time').textContent = '00:00';
        });
      }
      
      // Démarrage de l'enregistrement
      if (startRecordingBtn && stopRecordingBtn) {
        startRecordingBtn.addEventListener('click', () => {
          audioService.startRecording();
          startRecordingBtn.disabled = true;
          stopRecordingBtn.disabled = false;
        });
      }
      
      // Arrêt de l'enregistrement
      if (stopRecordingBtn && recorderSave) {
        stopRecordingBtn.addEventListener('click', async () => {
          const audioBlob = await audioService.stopRecording();
          stopRecordingBtn.disabled = true;
          startRecordingBtn.disabled = false;
          recorderSave.style.display = 'block';
          
          // Stockage temporaire du blob
          window.recordedAudioBlob = audioBlob;
        });
      }
      
      // Sauvegarde de l'enregistrement
      if (saveRecordingBtn) {
        saveRecordingBtn.addEventListener('click', async () => {
          const recordingName = document.getElementById('recording-name').value;
          const recordingDescription = document.getElementById('recording-description').value;
          
          if (!recordingName) {
            utils.showNotification('Veuillez fournir un nom pour l\'enregistrement', 'warning');
            return;
          }
          
          try {
            await audioService.saveAudioRecord(
              window.recordedAudioBlob,
              recordingName,
              recordingDescription
            );
            
            // Réinitialisation du formulaire
            document.getElementById('recording-name').value = '';
            document.getElementById('recording-description').value = '';
            
            // Masquage du formulaire
            audioRecorder.style.display = 'none';
            
            // Notification
            utils.showNotification('Enregistrement sauvegardé avec succès', 'success');
            
            // Mise à jour de la liste
            audioService.loadAudioList();
          } catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'enregistrement', error);
            utils.showNotification('Erreur lors de la sauvegarde de l\'enregistrement', 'error');
          }
        });
      }
      
      // Annulation de l'enregistrement
      if (cancelRecordingBtn && audioRecorder) {
        cancelRecordingBtn.addEventListener('click', () => {
          audioRecorder.style.display = 'none';
          window.recordedAudioBlob = null;
        });
      }
      
      // Chargement de la liste des enregistrements
      audioService.loadAudioList();
    },
  
    /**
     * Charge la page des données financières
     * @param {HTMLElement} container - Conteneur de la page
     */
    loadFinancialPage(container) {
      // Récupération du template
      const template = document.getElementById('financial-page-template');
      
      // Remplacement du contenu
      container.innerHTML = '';
      container.appendChild(document.importNode(template.content, true));
      
      // Gestion du bouton Nouvelles Données
      const newDataBtn = document.getElementById('new-data-btn');
      const financialForm = document.getElementById('financial-form');
      const dataForm = document.getElementById('data-form');
      const cancelDataBtn = document.getElementById('cancel-data');
      
      // Affichage du formulaire
      if (newDataBtn && financialForm) {
        newDataBtn.addEventListener('click', () => {
          financialForm.style.display = 'block';
          dataForm.reset();
        });
      }
      
      // Soumission du formulaire
      if (dataForm) {
        dataForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          try {
            const formData = new FormData(dataForm);
            const dataType = formData.get('data-type');
            const content = formData.get('data-content');
            const notes = formData.get('data-notes');
            
            // Vérifications
            if (!dataType || !content) {
              utils.showNotification('Veuillez remplir tous les champs obligatoires', 'warning');
              return;
            }
            
            // Création des données
            await financialService.createFinancialData({
              data_type: dataType,
              content,
              notes
            });
            
            // Réinitialisation du formulaire
            dataForm.reset();
            
            // Masquage du formulaire
            financialForm.style.display = 'none';
            
            // Notification
            utils.showNotification('Données financières créées avec succès', 'success');
            
            // Mise à jour de la liste
            financialService.loadFinancialList();
          } catch (error) {
            console.error('Erreur lors de la création des données financières', error);
            utils.showNotification('Erreur lors de la création des données', 'error');
          }
        });
      }
      
      // Annulation
      if (cancelDataBtn && financialForm) {
        cancelDataBtn.addEventListener('click', () => {
          financialForm.style.display = 'none';
        });
      }
      
      // Filtre par type
      const filterType = document.getElementById('filter-type');
      if (filterType) {
        filterType.addEventListener('change', () => {
          const dataType = filterType.value || null;
          financialService.loadFinancialList(1, dataType);
        });
      }
      
      // Chargement de la liste des données financières
      financialService.loadFinancialList();
    },
  
    /**
     * Charge la page de profil
     * @param {HTMLElement} container - Conteneur de la page
     */
    loadProfilePage(container) {
      // Récupération du template
      const template = document.getElementById('profile-page-template');
      
      // Remplacement du contenu
      container.innerHTML = '';
      container.appendChild(document.importNode(template.content, true));
      
      // Chargement des informations du profil
      profileService.loadUserProfile();
    },
  
    /**
     * Charge le tableau de bord administrateur
     */
    loadAdminDashboard() {
      // Récupération du template
      const template = document.getElementById('admin-dashboard-template');
      const appContainer = document.getElementById('app');
      
      // Remplacement du contenu
      appContainer.innerHTML = '';
      appContainer.appendChild(document.importNode(template.content, true));
      
      // Récupération de l'utilisateur
      const user = authService.getCurrentUser();
      
      // Vérification des droits d'administrateur
      if (!user || user.role !== 'admin') {
        utils.showNotification('Accès non autorisé', 'error');
        window.location.href = '/dashboard.html';
        return;
      }
      
      // Affichage du nom d'utilisateur
      const adminFullname = document.getElementById('admin-fullname');
      if (adminFullname && user) {
        adminFullname.textContent = user.full_name;
      }
      
      // Gestion du bouton de déconnexion
      const logoutBtn = document.getElementById('admin-logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          try {
            await authService.logout();
            this.loadLoginPage();
          } catch (error) {
            console.error('Erreur lors de la déconnexion', error);
            utils.showNotification('Erreur lors de la déconnexion', 'error');
          }
        });
      }

      // Configuration des écouteurs d'événements
      this.setupAdminEventListeners();

      // Chargement de la liste des utilisateurs
      this.loadUsersList();
    },
  
    async loadUsersList() {
      const usersList = document.getElementById('users-list');
      if (!usersList) return;

      try {
        const response = await api.get('/admin/users');
        const users = Array.isArray(response) ? response : response.data;
        
        if (!users || users.length === 0) {
          usersList.innerHTML = '<div class="empty-message">Aucun utilisateur trouvé</div>';
          return;
        }
        
        usersList.innerHTML = '';
        
        users.forEach(user => {
          const userItem = document.createElement('div');
          userItem.className = 'user-item';
          userItem.dataset.id = user.id;
          
          userItem.innerHTML = `
            <div class="user-info">
              <div class="user-name">${user.full_name || 'Non spécifié'}</div>
              <div class="user-email">${user.email || 'Non spécifié'}</div>
              <div class="user-role">${user.role || 'user'}</div>
            </div>
            <div class="user-actions">
              <button class="btn-icon edit-user" title="Modifier">
                <span class="icon"><i class="fa-solid fa-pen-to-square"></i></span>
              </button>
              <button class="btn-icon delete-user" title="Supprimer">
                <span class="icon"><i class="fa-solid fa-trash"></i></span>
              </button>
            </div>
          `;
          
          // Ajout des événements pour les boutons
          const editButton = userItem.querySelector('.edit-user');
          editButton.addEventListener('click', () => this.handleEditUser(user.id));
          
          const deleteButton = userItem.querySelector('.delete-user');
          deleteButton.addEventListener('click', () => this.handleDeleteUser(user.id));
          
          usersList.appendChild(userItem);
        });
        
        // Ajout de l'événement de recherche
        const searchInput = document.getElementById('user-search');
        if (searchInput) {
          searchInput.addEventListener('input', (e) => {
            this.filterUsers(e.target.value);
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        usersList.innerHTML = `
          <div class="error-message">
            Erreur lors du chargement des utilisateurs. 
            ${error.response?.data?.message || 'Veuillez réessayer plus tard.'}
          </div>
        `;
      }
    },
  
    // Fonction pour gérer l'édition d'un utilisateur
    async handleEditUser(userId) {
      try {
        const response = await api.get(`/admin/users/${userId}`);
        const user = response;
        
        const modal = document.getElementById('modal-container');
        const modalTitle = modal.querySelector('.modal-title');
        const modalContent = modal.querySelector('.modal-content');
        
        modalTitle.textContent = 'Modifier l\'utilisateur';
        
        // Formulaire d'édition
        modalContent.innerHTML = `
          <form id="edit-user-form">
            <div class="form-group">
              <label for="edit-username">Nom d'utilisateur</label>
              <input type="text" id="edit-username" name="username" value="${user.username}" required>
            </div>
            <div class="form-group">
              <label for="edit-email">Email</label>
              <input type="email" id="edit-email" name="email" value="${user.email}" required>
            </div>
            <div class="form-group">
              <label for="edit-fullname">Nom complet</label>
              <input type="text" id="edit-fullname" name="full_name" value="${user.full_name}" required>
            </div>
            <div class="form-group">
              <label for="edit-password">Nouveau mot de passe (laisser vide pour ne pas changer)</label>
              <input type="password" id="edit-password" name="password">
              <small class="form-text text-muted">
                Le mot de passe doit contenir au moins 8 caractères, une lettre majuscule, 
                une lettre minuscule, un chiffre et un caractère spécial.
              </small>
            </div>
            <div class="form-group">
              <label for="edit-role">Rôle</label>
              <select id="edit-role" name="role">
                <option value="user" ${user.role === 'user' ? 'selected' : ''}>Utilisateur</option>
                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrateur</option>
              </select>
            </div>
            <div class="form-buttons">
              <button type="submit" class="btn btn-primary">Enregistrer</button>
              <button type="button" class="btn btn-secondary modal-close">Annuler</button>
            </div>
          </form>
        `;
        
        // Affichage de la modal
        modal.style.display = 'flex';
        
        // Gestion du formulaire
        const form = modalContent.querySelector('#edit-user-form');
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          try {
            const formData = new FormData(form);
            const password = formData.get('password');
            
            // Validation du mot de passe si fourni
            if (password && !this.validatePassword(password)) {
              utils.showNotification(
                'Le mot de passe doit contenir au moins 8 caractères, une lettre majuscule, ' +
                'une lettre minuscule, un chiffre et un caractère spécial.',
                'error'
              );
              return;
            }
            
            const updateData = {
              username: formData.get('username'),
              email: formData.get('email'),
              full_name: formData.get('full_name'),
              role: formData.get('role')
            };
            
            // Ajout du mot de passe seulement s'il est fourni
            if (password) {
              updateData.password = password;
            }
            
            await api.put(`/admin/users/${userId}`, updateData);
            
            modal.style.display = 'none';
            utils.showNotification('Utilisateur mis à jour avec succès', 'success');
            this.loadUsersList();
          } catch (error) {
            utils.showNotification(error.response?.data?.message || 'Erreur lors de la mise à jour de l\'utilisateur', 'error');
          }
        });
        
        // Gestion de la fermeture de la modal
        const closeButton = modalContent.querySelector('.modal-close');
        closeButton.addEventListener('click', () => {
          modal.style.display = 'none';
        });
      } catch (error) {
        utils.showNotification(error.response?.data?.message || 'Erreur lors du chargement des données de l\'utilisateur', 'error');
      }
    },
  
    // Fonction pour gérer la suppression d'un utilisateur
    async handleDeleteUser(userId) {
      const confirmed = await utils.confirmDialog('Êtes-vous sûr de vouloir supprimer cet utilisateur ?');
      
      if (confirmed) {
        try {
          await api.delete(`/admin/users/${userId}`);
          utils.showNotification('Utilisateur supprimé avec succès', 'success');
          this.loadUsersList();
        } catch (error) {
          console.error('Erreur lors de la suppression de l\'utilisateur:', error);
          utils.showNotification('Erreur lors de la suppression', 'error');
        }
      }
    },

    // Ajout de la gestion du formulaire d'ajout d'utilisateur
    setupAdminEventListeners() {
      const newUserBtn = document.getElementById('new-user-btn');
      if (newUserBtn) {
        newUserBtn.addEventListener('click', () => {
          const modal = document.getElementById('modal-container');
          const modalTitle = modal.querySelector('.modal-title');
          const modalContent = modal.querySelector('.modal-content');
          
          modalTitle.textContent = 'Nouvel utilisateur';
          
          // Formulaire d'ajout
          modalContent.innerHTML = `
            <form id="new-user-form">
              <div class="form-group">
                <label for="new-username">Nom d'utilisateur</label>
                <input type="text" id="new-username" name="username" required>
              </div>
              <div class="form-group">
                <label for="new-email">Email</label>
                <input type="email" id="new-email" name="email" required>
              </div>
              <div class="form-group">
                <label for="new-fullname">Nom complet</label>
                <input type="text" id="new-fullname" name="full_name" required>
              </div>
              <div class="form-group">
                <label for="new-password">Mot de passe</label>
                <input type="password" id="new-password" name="password" required>
                <small class="form-text text-muted">
                  Le mot de passe doit contenir au moins 8 caractères, une lettre majuscule, 
                  une lettre minuscule, un chiffre et un caractère spécial.
                </small>
              </div>
              <div class="form-group">
                <label for="new-role">Rôle</label>
                <select id="new-role" name="role">
                  <option value="user">Utilisateur</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              <div class="form-buttons">
                <button type="submit" class="btn btn-primary">Créer</button>
                <button type="button" class="btn btn-secondary modal-close">Annuler</button>
              </div>
            </form>
          `;
          
          // Affichage de la modal
          modal.style.display = 'flex';
          
          // Gestion du formulaire
          const form = modalContent.querySelector('#new-user-form');
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
              const formData = new FormData(form);
              const password = formData.get('password');
              
              // Validation du mot de passe
              if (!this.validatePassword(password)) {
                utils.showNotification(
                  'Le mot de passe doit contenir au moins 8 caractères, une lettre majuscule, ' +
                  'une lettre minuscule, un chiffre et un caractère spécial.',
                  'error'
                );
                return;
              }
              
              const userData = {
                username: formData.get('username'),
                email: formData.get('email'),
                full_name: formData.get('full_name'),
                password: password,
                role: formData.get('role')
              };
              
              await api.post('/admin/users', userData);
              
              modal.style.display = 'none';
              utils.showNotification('Utilisateur créé avec succès', 'success');
              this.loadUsersList();
            } catch (error) {
              console.error('Erreur lors de la création de l\'utilisateur:', error);
              utils.showNotification(error.message || 'Erreur lors de la création', 'error');
            }
          });
        });
      }
    },

    // Fonction de validation du mot de passe
    validatePassword(password) {
      const minLength = 8;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      
      return password.length >= minLength && 
             hasUpperCase && 
             hasLowerCase && 
             hasNumbers && 
             hasSpecialChar;
    },

    // Fonction pour filtrer les utilisateurs
    filterUsers(searchTerm) {
      const usersList = document.getElementById('users-list');
      const userItems = usersList.getElementsByClassName('user-item');
      
      searchTerm = searchTerm.toLowerCase();
      
      Array.from(userItems).forEach(item => {
        const userName = item.querySelector('.user-name').textContent.toLowerCase();
        const userEmail = item.querySelector('.user-email').textContent.toLowerCase();
        const userRole = item.querySelector('.user-role').textContent.toLowerCase();
        
        const matches = userName.includes(searchTerm) || 
                       userEmail.includes(searchTerm) || 
                       userRole.includes(searchTerm);
        
        item.style.display = matches ? '' : 'none';
      });
    },

    /**
     * Initialise les événements de la page
     */
    initEvents() {
      // Gestion du formulaire de mot de passe oublié
      const forgotPasswordForm = document.getElementById('forgot-password-form');
      if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', (e) => {
          authService.handleForgotPassword(e);
        });
      }

      // Gestion du lien "Mot de passe oublié"
      const forgotPasswordLink = document.getElementById('forgot-password-link');
      if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
          e.preventDefault();
          const container = document.querySelector('.auth-container');
          const template = document.getElementById('forgot-password-template');
          container.innerHTML = '';
          container.appendChild(document.importNode(template.content, true));
        });
      }

      // Gestion du lien "Retour à la connexion"
      const backToLoginLink = document.getElementById('back-to-login');
      if (backToLoginLink) {
        backToLoginLink.addEventListener('click', (e) => {
          e.preventDefault();
          const container = document.querySelector('.auth-container');
          const template = document.getElementById('login-template');
          container.innerHTML = '';
          container.appendChild(document.importNode(template.content, true));
        });
      }
    }
  };
  
  // Démarrage de l'application au chargement de la page
  document.addEventListener('DOMContentLoaded', () => {
    app.init();
  });