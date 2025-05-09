const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const audioRoutes = require('./routes/audio.routes');
const financialRoutes = require('./routes/financial.routes');
const adminRoutes = require('./routes/admin.routes');

// Initialisation de l'application Express
const app = express();

// Middleware de base
app.use(helmet()); // Sécurité HTTP
app.use(cors()); // Gestion des CORS
app.use(express.json()); // Parser pour JSON
app.use(express.urlencoded({ extended: true })); // Parser pour URL-encoded

// Route de base pour vérifier que l'API est en ligne
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API Moustass Web' });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/admin', adminRoutes);

// Middleware pour gérer les erreurs
app.use(errorHandler);

// Middleware pour les routes non trouvées
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

module.exports = app;