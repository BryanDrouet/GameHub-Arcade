// Main app bootstrap — module
import { initGuess } from './games/guess.js';
import { initMemory } from './games/memory.js';
import { initTic } from './games/tictactoe.js';

// Firebase config for GameHub Arcade
// TODO: Replace with your actual Firebase project config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "gamehub-arcade.firebaseapp.com", 
  databaseURL: "https://gamehub-arcade-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gamehub-arcade",
  storageBucket: "gamehub-arcade.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase (compat loaded in page)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

const state = { 
  user: null, 
  uid: null, 
  username: null,
  showingAuth: false 
};

// Authentication state management
auth.onAuthStateChanged(async user => {
  const statusDot = document.querySelector('.status-dot');
  const statusText = document.querySelector('.status-text');
  
  if (user) {
    state.user = user;
    state.uid = user.uid;
    
    // Get username from database
    try {
      const userDoc = await db.ref(`users/${user.uid}`).once('value');
      const userData = userDoc.val();
      state.username = userData?.username || 'Joueur';
      
      statusDot.classList.add('connected');
      statusText.textContent = `${state.username}`;
      document.getElementById('user-actions').classList.remove('hidden');
      hideAuthModal();
      loadLeaderboards();
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
    }
  } else {
    state.user = null;
    state.uid = null;
    state.username = null;
    statusDot.classList.remove('connected');
    statusText.textContent = 'Non connecté';
    document.getElementById('user-actions').classList.add('hidden');
    showAuthModal();
  }
});

// Authentication functions
async function registerUser(email, password, username) {
  try {
    // Create account
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Save user profile to database
    await db.ref(`users/${user.uid}`).set({
      username: username,
      email: email,
      createdAt: Date.now(),
      stats: {
        gamesPlayed: 0,
        totalScore: 0
      }
    });
    
    console.log('Compte créé avec succès');
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la création du compte:', error);
    return { success: false, error: error.message };
  }
}

async function loginUser(email, password) {
  try {
    await auth.signInWithEmailAndPassword(email, password);
    console.log('Connexion réussie');
    return { success: true };
  } catch (error) {
    console.error('Erreur de connexion:', error);
    return { success: false, error: error.message };
  }
}

function logoutUser() {
  auth.signOut();
}

// Auth Modal Management
function showAuthModal() {
  if (state.showingAuth) return;
  state.showingAuth = true;
  
  const modal = document.createElement('div');
  modal.id = 'auth-modal';
  modal.className = 'auth-modal';
  modal.innerHTML = `
    <div class="auth-container">
      <div class="auth-header">
        <h2>🎮 GameHub Arcade</h2>
        <p>Connectez-vous pour sauvegarder vos scores !</p>
      </div>
      
      <div class="auth-tabs">
        <button class="tab-btn active" data-tab="login">Connexion</button>
        <button class="tab-btn" data-tab="register">Inscription</button>
      </div>
      
      <!-- Login Form -->
      <form id="login-form" class="auth-form active">
        <div class="input-group">
          <input type="email" id="login-email" placeholder="Adresse email" required>
        </div>
        <div class="input-group">
          <input type="password" id="login-password" placeholder="Mot de passe" required>
        </div>
        <button type="submit" class="auth-btn">Se connecter</button>
        <div class="auth-error" id="login-error"></div>
      </form>
      
      <!-- Register Form -->
      <form id="register-form" class="auth-form">
        <div class="input-group">
          <input type="text" id="register-username" placeholder="Pseudo" required maxlength="20">
        </div>
        <div class="input-group">
          <input type="email" id="register-email" placeholder="Adresse email" required>
        </div>
        <div class="input-group">
          <input type="password" id="register-password" placeholder="Mot de passe" required minlength="6">
        </div>
        <div class="input-group">
          <input type="password" id="register-confirm" placeholder="Confirmer le mot de passe" required>
        </div>
        <button type="submit" class="auth-btn">Créer un compte</button>
        <div class="auth-error" id="register-error"></div>
      </form>
      
      <div class="auth-footer">
        <small>Vos mots de passe sont cryptés et sécurisés par Firebase Auth</small>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  setupAuthModalEvents();
}

function hideAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.remove();
    state.showingAuth = false;
  }
}

function setupAuthModalEvents() {
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      
      // Update active tab
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(`${tab}-form`).classList.add('active');
    });
  });
  
  // Login form
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    
    errorDiv.textContent = '';
    const result = await loginUser(email, password);
    
    if (!result.success) {
      errorDiv.textContent = getErrorMessage(result.error);
    }
  });
  
  // Register form
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    const errorDiv = document.getElementById('register-error');
    
    errorDiv.textContent = '';
    
    if (password !== confirm) {
      errorDiv.textContent = 'Les mots de passe ne correspondent pas';
      return;
    }
    
    if (username.length < 3) {
      errorDiv.textContent = 'Le pseudo doit faire au moins 3 caractères';
      return;
    }
    
    const result = await registerUser(email, password, username);
    
    if (!result.success) {
      errorDiv.textContent = getErrorMessage(result.error);
    }
  });
}

function getErrorMessage(error) {
  const errorMessages = {
    'auth/email-already-in-use': 'Cette adresse email est déjà utilisée',
    'auth/invalid-email': 'Adresse email invalide',
    'auth/weak-password': 'Le mot de passe doit faire au moins 6 caractères',
    'auth/user-not-found': 'Aucun compte trouvé avec cette adresse',
    'auth/wrong-password': 'Mot de passe incorrect',
    'auth/too-many-requests': 'Trop de tentatives, réessayez plus tard'
  };
  
  return errorMessages[error] || 'Une erreur est survenue';
}

function loadLeaderboards(){
  const boards = document.getElementById('boards');
  boards.innerHTML = '';
  const games = ['guess','memory','tictactoe'];
  games.forEach(g => {
    const box = document.createElement('div');
    box.className = 'board';
    box.innerHTML = `<h3>${g}</h3><div id="lb-${g}">chargement…</div>`;
    boards.appendChild(box);
    const ref = db.ref(`leaderboards/${g}`).orderByChild('score').limitToFirst(10);
    ref.on('value', snap => {
      const el = document.getElementById(`lb-${g}`);
      const arr = [];
      snap.forEach(ch => arr.push(ch.val()));
      if (!arr.length) el.textContent = '— aucune donnée —';
      else {
        el.innerHTML = '<ol>' + arr.map(a => `<li>${escapeHtml(a.name||'Anon')}: ${a.score}</li>`).join('') + '</ol>';
      }
    });
  });
}

function escapeHtml(s){return String(s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}

// Particles animation
function createParticles() {
  const container = document.getElementById('particles');
  const particleCount = 15;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 6 + 's';
    particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
    container.appendChild(particle);
  }
}

// Game switching with animations
document.querySelectorAll('.games-list button').forEach(b=>{
  b.addEventListener('click', ()=>{
    const game = b.dataset.game;
    const area = document.getElementById('game-area');
    
    // Add loading animation
    area.style.opacity = '0';
    area.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      area.innerHTML = '';
      if (game==='guess') initGuess(area, {db, uid: state.uid});
      if (game==='memory') initMemory(area, {db, uid: state.uid});
      if (game==='tictactoe') initTic(area, {db, uid: state.uid});
      
      // Animate in
      area.style.opacity = '1';
      area.style.transform = 'translateY(0)';
    }, 200);
  });
});

// Refresh leaderboard button
document.getElementById('refresh-leaderboard')?.addEventListener('click', loadLeaderboards);

// Initialize particles on load
document.addEventListener('DOMContentLoaded', createParticles);

// User action button events
document.getElementById('logout-btn')?.addEventListener('click', logoutUser);
document.getElementById('profile-btn')?.addEventListener('click', showProfileModal);

// Profile Modal
function showProfileModal() {
  if (!state.user) return;
  
  const modal = document.createElement('div');
  modal.id = 'profile-modal';
  modal.className = 'auth-modal';
  
  // Get user stats
  db.ref(`users/${state.uid}`).once('value').then(snapshot => {
    const userData = snapshot.val() || {};
    const stats = userData.stats || { gamesPlayed: 0, totalScore: 0 };
    
    modal.innerHTML = `
      <div class="auth-container profile-container">
        <div class="profile-header">
          <div class="profile-avatar">👤</div>
          <h2>${state.username}</h2>
          <p>${state.user.email}</p>
        </div>
        
        <div class="profile-stats">
          <div class="stat-card">
            <div class="stat-number">${stats.gamesPlayed || 0}</div>
            <div class="stat-label">Parties jouées</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${stats.totalScore || 0}</div>
            <div class="stat-label">Score total</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${Math.round((stats.totalScore || 0) / Math.max(stats.gamesPlayed || 1, 1))}</div>
            <div class="stat-label">Score moyen</div>
          </div>
        </div>
        
        <div class="profile-actions">
          <button id="change-username-btn" class="profile-btn">✏️ Changer le pseudo</button>
          <button id="close-profile" class="profile-btn secondary">Fermer</button>
        </div>
        
        <div id="username-edit" class="username-edit hidden">
          <div class="input-group">
            <input type="text" id="new-username" placeholder="Nouveau pseudo" maxlength="20" value="${state.username}">
          </div>
          <div class="profile-actions">
            <button id="save-username" class="profile-btn">Sauvegarder</button>
            <button id="cancel-username" class="profile-btn secondary">Annuler</button>
          </div>
          <div class="auth-error" id="username-error"></div>
        </div>
        
        <div class="profile-footer">
          <small>Membre depuis ${new Date(userData.createdAt || Date.now()).toLocaleDateString('fr-FR')}</small>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    setupProfileModalEvents();
  });
}

function setupProfileModalEvents() {
  // Close modal
  document.getElementById('close-profile').addEventListener('click', () => {
    document.getElementById('profile-modal').remove();
  });
  
  // Show username edit
  document.getElementById('change-username-btn').addEventListener('click', () => {
    document.getElementById('username-edit').classList.remove('hidden');
    document.getElementById('new-username').focus();
  });
  
  // Cancel username edit
  document.getElementById('cancel-username').addEventListener('click', () => {
    document.getElementById('username-edit').classList.add('hidden');
    document.getElementById('new-username').value = state.username;
  });
  
  // Save new username
  document.getElementById('save-username').addEventListener('click', async () => {
    const newUsername = document.getElementById('new-username').value.trim();
    const errorDiv = document.getElementById('username-error');
    
    if (newUsername.length < 3) {
      errorDiv.textContent = 'Le pseudo doit faire au moins 3 caractères';
      return;
    }
    
    try {
      await db.ref(`users/${state.uid}/username`).set(newUsername);
      state.username = newUsername;
      document.querySelector('.status-text').textContent = newUsername;
      document.getElementById('profile-modal').remove();
    } catch (error) {
      errorDiv.textContent = 'Erreur lors de la sauvegarde';
    }
  });
  
  // Close modal on background click
  document.getElementById('profile-modal').addEventListener('click', (e) => {
    if (e.target.id === 'profile-modal') {
      document.getElementById('profile-modal').remove();
    }
  });
}

// Enhanced score submission with user data
export function submitScore(game, score, customName = null){
  if (!state.uid) {
    console.warn('User not logged in, cannot submit score');
    return Promise.reject('Not logged in');
  }
  
  const payload = {
    score, 
    name: customName || state.username || 'Joueur',
    userId: state.uid,
    ts: Date.now()
  };
  
  // Also update user stats
  db.ref(`users/${state.uid}/stats`).transaction(stats => {
    if (!stats) stats = { gamesPlayed: 0, totalScore: 0 };
    stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
    stats.totalScore = (stats.totalScore || 0) + score;
    return stats;
  });
  
  return db.ref(`leaderboards/${game}`).push(payload);
}
