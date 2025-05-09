const crypto = require('crypto');

// Génération d'une clé de 32 octets (256 bits) pour AES-256
const key = crypto.randomBytes(32);

// Conversion en base64 pour faciliter le stockage
const base64Key = key.toString('base64');

console.log('Clé de chiffrement générée :');
console.log(base64Key);
console.log('\nAjoutez cette ligne à votre fichier .env :');
console.log(`ENCRYPTION_KEY=${base64Key}`); 