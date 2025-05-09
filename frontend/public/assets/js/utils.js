/**
 * Utilitaires pour l'application
 */
const utils = {
    /**
     * Formate une date pour l'affichage
     * @param {string} dateString - Date au format ISO
     * @returns {string} Date formatée
     */
    formatDate(dateString) {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    },
  
    /**
     * Formate une durée en secondes en format mm:ss
     * @param {number} seconds - Durée en secondes
     * @returns {string} Durée formatée
     */
    formatDuration(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
  
    /**
     * Tronque un texte à une longueur donnée
     * @param {string} text - Texte à tronquer
     * @param {number} maxLength - Longueur maximale
     * @returns {string} Texte tronqué
     */
    truncateText(text, maxLength = 100) {
      if (!text || text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    },
  
    /**
     * Échappe les caractères HTML
     * @param {string} html - Chaîne contenant du HTML
     * @returns {string} Chaîne échappée
     */
    escapeHTML(html) {
      const div = document.createElement('div');
      div.textContent = html;
      return div.innerHTML;
    },
  
    /**
     * Affiche une notification
     * @param {string} message - Message à afficher
     * @param {string} type - Type de notification (success, error, warning, info)
     * @param {number} duration - Durée d'affichage en ms
     */
    showNotification(message, type = 'info', duration = 3000) {
      // Création de l'élément de notification
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.textContent = message;
      
      // Ajout au DOM
      document.body.appendChild(notification);
      
      // Animation d'entrée
      setTimeout(() => {
        notification.classList.add('show');
      }, 10);
      
      // Suppression après la durée spécifiée
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          notification.remove();
        }, 300); // Temps de l'animation de sortie
      }, duration);
    },
  
    /**
     * Affiche une boîte de dialogue de confirmation
     * @param {string} message - Message à afficher
     * @returns {Promise<boolean>} Résultat de la confirmation
     */
    confirmDialog(message) {
      return new Promise((resolve) => {
        // Création de la modal
        const modal = document.createElement('div');
        modal.className = 'modal-container';
        modal.style.display = 'flex';
        
        // Contenu de la modal
        modal.innerHTML = `
          <div class="modal">
            <div class="modal-header">
              <h3 class="modal-title">Confirmation</h3>
              <button class="modal-close">&times;</button>
            </div>
            <div class="modal-content">
              <p>${this.escapeHTML(message)}</p>
              <div class="form-buttons">
                <button class="btn btn-primary" id="confirm-yes">Confirmer</button>
                <button class="btn btn-secondary" id="confirm-no">Annuler</button>
              </div>
            </div>
          </div>
        `;
        
        // Ajout au DOM
        document.body.appendChild(modal);
        
        // Gestion des événements
        const closeBtn = modal.querySelector('.modal-close');
        const yesBtn = modal.querySelector('#confirm-yes');
        const noBtn = modal.querySelector('#confirm-no');
        
        const close = (result) => {
          modal.remove();
          resolve(result);
        };
        
        closeBtn.addEventListener('click', () => close(false));
        yesBtn.addEventListener('click', () => close(true));
        noBtn.addEventListener('click', () => close(false));
      });
    },
  
    /**
     * Génère une pagination
     * @param {number} currentPage - Page actuelle
     * @param {number} totalPages - Nombre total de pages
     * @param {Function} onPageChange - Fonction appelée lors du changement de page
     * @returns {HTMLElement} Élément de pagination
     */
    createPagination(currentPage, totalPages, onPageChange) {
      // Création du conteneur
      const pagination = document.createElement('div');
      pagination.className = 'pagination';
      
      // Fonction pour créer un élément de pagination
      const createPageItem = (page, label, isActive = false, isDisabled = false) => {
        const item = document.createElement('div');
        item.className = `pagination-item${isActive ? ' active' : ''}`;
        item.textContent = label;
        
        if (!isDisabled) {
          item.addEventListener('click', () => onPageChange(page));
        } else {
          item.classList.add('disabled');
        }
        
        return item;
      };
      
      // Bouton précédent
      pagination.appendChild(createPageItem(
        currentPage - 1,
        '«',
        false,
        currentPage === 1
      ));
      
      // Pages
      const maxVisiblePages = 5;
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      // Première page si nécessaire
      if (startPage > 1) {
        pagination.appendChild(createPageItem(1, '1'));
        if (startPage > 2) {
          pagination.appendChild(createPageItem(null, '...', false, true));
        }
      }
      
      // Pages visibles
      for (let i = startPage; i <= endPage; i++) {
        pagination.appendChild(createPageItem(i, i.toString(), i === currentPage));
      }
      
      // Dernière page si nécessaire
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pagination.appendChild(createPageItem(null, '...', false, true));
        }
        pagination.appendChild(createPageItem(totalPages, totalPages.toString()));
      }
      
      // Bouton suivant
      pagination.appendChild(createPageItem(
        currentPage + 1,
        '»',
        false,
        currentPage === totalPages
      ));
      
      return pagination;
    },
  
    /**
     * Convertit un Blob en Base64
     * @param {Blob} blob - Blob à convertir
     * @returns {Promise<string>} Chaîne Base64
     */
    async blobToBase64(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  };