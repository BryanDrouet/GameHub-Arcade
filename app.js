// GameHub Arcade Pro - Main Application
// Plateforme de jeux sociale complète avec Firebase

// Import game modules
import { initGuess } from './games/guess.js';
import { initMemory } from './games/memory.js';
import { initTic } from './games/tictactoe.js';

// Import config and feature modules
import { firebaseConfig, ADMIN_USERNAME, AUTH_PROVIDERS } from './config.js';
import { validateUsername, validateEmail, isUsernameBanned } from './moderation.js';
import { initFriends, updateOnlineStatus, sendFriendRequest, getFriendRequests, acceptFriendRequest, rejectFriendRequest } from './friends.js';
import { initChat, openChatModal, getUserChats } from './chat.js';
import { initAdmin } from './admin.js';
import { initLeaderboard, loadLeaderboards as loadLeaderboardsModule, submitScore as submitScoreModule } from './leaderboard.js';

// Initialize Firebase (compat loaded in HTML)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
const storage = firebase.storage();

const state = { 
  user: null, 
  uid: null, 
  username: null,
  showingAuth: false,
  favoriteGames: [],
  pinnedGames: []
};

// Initialize all modules when Firebase is ready
document.addEventListener('DOMContentLoaded', () => {
  initFriends(db, auth);
  initChat(db, auth);
  initAdmin(db, auth);
  initLeaderboard(db, auth);
});

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

// Social login functions
async function loginWithGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await auth.signInWithPopup(provider);
    await handleSocialLogin(result.user);
    return { success: true };
  } catch (error) {
    console.error('Erreur connexion Google:', error);
    return { success: false, error: error.message };
  }
}

async function loginWithFacebook() {
  try {
    const provider = new firebase.auth.FacebookAuthProvider();
    const result = await auth.signInWithPopup(provider);
    await handleSocialLogin(result.user);
    return { success: true };
  } catch (error) {
    console.error('Erreur connexion Facebook:', error);
    return { success: false, error: error.message };
  }
}

async function loginWithMicrosoft() {
  try {
    const provider = new firebase.auth.OAuthProvider('microsoft.com');
    const result = await auth.signInWithPopup(provider);
    await handleSocialLogin(result.user);
    return { success: true };
  } catch (error) {
    console.error('Erreur connexion Microsoft:', error);
    return { success: false, error: error.message };
  }
}

// Handle social login (create user profile if first time)
async function handleSocialLogin(user) {
  const userRef = db.ref(`users/${user.uid}`);
  const snapshot = await userRef.once('value');
  
  if (!snapshot.exists()) {
    // First time login - create profile
    const username = user.displayName || user.email.split('@')[0] || 'Joueur';
    await userRef.set({
      username: username,
      email: user.email,
      photoURL: user.photoURL || null,
      provider: user.providerData[0].providerId,
      createdAt: Date.now(),
      stats: {
        gamesPlayed: 0,
        totalScore: 0
      }
    });
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
        <h2>🎮 GameHub Arcade Pro</h2>
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
        
        <div class="auth-divider">
          <span>ou continuer avec</span>
        </div>
        
        <div class="social-login-buttons">
          ${AUTH_PROVIDERS.GOOGLE ? '<button type="button" class="social-btn google-btn" id="google-login"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google"> Google</button>' : ''}
          ${AUTH_PROVIDERS.FACEBOOK ? '<button type="button" class="social-btn facebook-btn" id="facebook-login"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="white" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> Facebook</button>' : ''}
          ${AUTH_PROVIDERS.MICROSOFT ? '<button type="button" class="social-btn microsoft-btn" id="microsoft-login"><svg viewBox="0 0 23 23" width="18" height="18"><path fill="#f3f3f3" d="M0 0h23v23H0z"/><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg> Microsoft</button>' : ''}
        </div>
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
        
        <div class="auth-divider">
          <span>ou s'inscrire avec</span>
        </div>
        
        <div class="social-login-buttons">
          ${AUTH_PROVIDERS.GOOGLE ? '<button type="button" class="social-btn google-btn" id="google-register"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google"> Google</button>' : ''}
          ${AUTH_PROVIDERS.FACEBOOK ? '<button type="button" class="social-btn facebook-btn" id="facebook-register"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="white" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> Facebook</button>' : ''}
          ${AUTH_PROVIDERS.MICROSOFT ? '<button type="button" class="social-btn microsoft-btn" id="microsoft-register"><svg viewBox="0 0 23 23" width="18" height="18"><path fill="#f3f3f3" d="M0 0h23v23H0z"/><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg> Microsoft</button>' : ''}
        </div>
      </form>
      
      <div class="auth-footer">
        <small>Vos données sont sécurisées par Firebase Auth</small>
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
  
  // Social login buttons (login form)
  if (AUTH_PROVIDERS.GOOGLE) {
    document.getElementById('google-login')?.addEventListener('click', async () => {
      const result = await loginWithGoogle();
      if (!result.success) {
        document.getElementById('login-error').textContent = getErrorMessage(result.error);
      }
    });
  }
  
  if (AUTH_PROVIDERS.FACEBOOK) {
    document.getElementById('facebook-login')?.addEventListener('click', async () => {
      const result = await loginWithFacebook();
      if (!result.success) {
        document.getElementById('login-error').textContent = getErrorMessage(result.error);
      }
    });
  }
  
  if (AUTH_PROVIDERS.MICROSOFT) {
    document.getElementById('microsoft-login')?.addEventListener('click', async () => {
      const result = await loginWithMicrosoft();
      if (!result.success) {
        document.getElementById('login-error').textContent = getErrorMessage(result.error);
      }
    });
  }
  
  // Social login buttons (register form - same handlers)
  if (AUTH_PROVIDERS.GOOGLE) {
    document.getElementById('google-register')?.addEventListener('click', async () => {
      const result = await loginWithGoogle();
      if (!result.success) {
        document.getElementById('register-error').textContent = getErrorMessage(result.error);
      }
    });
  }
  
  if (AUTH_PROVIDERS.FACEBOOK) {
    document.getElementById('facebook-register')?.addEventListener('click', async () => {
      const result = await loginWithFacebook();
      if (!result.success) {
        document.getElementById('register-error').textContent = getErrorMessage(result.error);
      }
    });
  }
  
  if (AUTH_PROVIDERS.MICROSOFT) {
    document.getElementById('microsoft-register')?.addEventListener('click', async () => {
      const result = await loginWithMicrosoft();
      if (!result.success) {
        document.getElementById('register-error').textContent = getErrorMessage(result.error);
      }
    });
  }
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

// Export for global access
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

// ========== NEW FEATURES ==========

// Friends button handler
document.getElementById('friends-btn')?.addEventListener('click', showFriendsModal);

function showFriendsModal() {
  const modal = document.createElement('div');
  modal.id = 'friends-modal';
  modal.className = 'auth-modal';
  modal.innerHTML = `
    <div class="auth-container">
      <div class="auth-header">
        <h2>👥 Amis</h2>
        <button class="close-btn" onclick="this.closest('.auth-modal').remove()">✕</button>
      </div>
      
      <div class="friends-tabs">
        <button class="tab-btn active" data-tab="list">Liste d'amis</button>
        <button class="tab-btn" data-tab="requests">Demandes</button>
        <button class="tab-btn" data-tab="add">Ajouter</button>
      </div>
      
      <!-- Friends List Tab -->
      <div id="friends-list-tab" class="friends-tab active">
        <div id="friends-list-container"></div>
      </div>
      
      <!-- Requests Tab -->
      <div id="friends-requests-tab" class="friends-tab">
        <div id="requests-container"></div>
      </div>
      
      <!-- Add Friend Tab -->
      <div id="friends-add-tab" class="friends-tab">
        <div class="input-group">
          <input type="text" id="friend-username-input" placeholder="Pseudo de l'utilisateur" maxlength="20">
        </div>
        <button onclick="window.sendFriendRequestFromModal()" class="auth-btn">Envoyer une demande</button>
        <div class="auth-error" id="friend-add-error"></div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  setupFriendsModalEvents();
  loadFriendsData();
}

function setupFriendsModalEvents() {
  document.querySelectorAll('.friends-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      
      document.querySelectorAll('.friends-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.friends-tab').forEach(t => t.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(`friends-${tab}-tab`).classList.add('active');
      
      if (tab === 'list') loadFriendsList();
      else if (tab === 'requests') loadFriendRequests();
    });
  });
}

async function loadFriendsData() {
  loadFriendsList();
  loadFriendRequests();
}

async function loadFriendsList() {
  const container = document.getElementById('friends-list-container');
  if (!container) return;
  
  container.innerHTML = '<div class="loading">Chargement...</div>';
  
  try {
    const friendsSnap = await db.ref(`friends/${state.uid}`).once('value');
    const friends = [];
    
    friendsSnap.forEach(child => {
      friends.push({
        id: child.key,
        ...child.val()
      });
    });
    
    if (friends.length === 0) {
      container.innerHTML = '<p class="empty-state">Aucun ami pour le moment</p>';
      return;
    }
    
    container.innerHTML = friends.map(friend => `
      <div class="friend-item">
        <div class="friend-info">
          <div class="friend-avatar">👤</div>
          <div class="friend-details">
            <div class="friend-name">${escapeHtml(friend.username)}</div>
            <div class="friend-status ${friend.status || 'offline'}">${friend.status === 'online' ? '🟢 En ligne' : '⚫ Hors ligne'}</div>
          </div>
        </div>
        <div class="friend-actions">
          <button class="btn-icon" onclick="window.openChat('${friend.id}')" title="Envoyer un message">💬</button>
          <button class="btn-icon" onclick="window.sendGameInvite('${friend.id}', 'tictactoe')" title="Inviter à jouer">🎮</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    container.innerHTML = `<p class="error-state">Erreur: ${error.message}</p>`;
  }
}

async function loadFriendRequests() {
  const container = document.getElementById('requests-container');
  if (!container) return;
  
  container.innerHTML = '<div class="loading">Chargement...</div>';
  
  try {
    const requestsSnap = await db.ref(`friendRequests/${state.uid}`).once('value');
    const requests = [];
    
    requestsSnap.forEach(child => {
      requests.push({
        id: child.key,
        ...child.val()
      });
    });
    
    if (requests.length === 0) {
      container.innerHTML = '<p class="empty-state">Aucune demande en attente</p>';
      return;
    }
    
    container.innerHTML = requests.map(request => `
      <div class="request-item">
        <div class="request-info">
          <div class="friend-avatar">👤</div>
          <div class="friend-name">${escapeHtml(request.username)}</div>
        </div>
        <div class="request-actions">
          <button class="btn-success" onclick="window.acceptFriend('${request.id}')">✓ Accepter</button>
          <button class="btn-danger" onclick="window.rejectFriend('${request.id}')">✕ Refuser</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    container.innerHTML = `<p class="error-state">Erreur: ${error.message}</p>`;
  }
}

// Global functions for friends
window.sendFriendRequestFromModal = async function() {
  const username = document.getElementById('friend-username-input').value.trim();
  const errorDiv = document.getElementById('friend-add-error');
  
  errorDiv.textContent = '';
  
  try {
    await sendFriendRequest(username);
    alert('Demande d\'ami envoyée !');
    document.getElementById('friend-username-input').value = '';
  } catch (error) {
    errorDiv.textContent = error.message;
  }
};

window.acceptFriend = async function(friendId) {
  try {
    await acceptFriendRequest(friendId);
    loadFriendRequests();
    loadFriendsList();
  } catch (error) {
    alert('Erreur: ' + error.message);
  }
};

window.rejectFriend = async function(friendId) {
  try {
    await rejectFriendRequest(friendId);
    loadFriendRequests();
  } catch (error) {
    alert('Erreur: ' + error.message);
  }
};

window.sendGameInvite = async function(friendId, gameType) {
  try {
    const { sendGameInvite } = await import('./chat.js');
    await sendGameInvite(friendId, gameType);
    alert('Invitation envoyée !');
  } catch (error) {
    alert('Erreur: ' + error.message);
  }
};

// Chat button handler
document.getElementById('chat-btn')?.addEventListener('click', showChatsModal);

async function showChatsModal() {
  try {
    const chats = await getUserChats();
    
    const modal = document.createElement('div');
    modal.id = 'chats-modal';
    modal.className = 'auth-modal';
    modal.innerHTML = `
      <div class="auth-container">
        <div class="auth-header">
          <h2>💬 Messages</h2>
          <button class="close-btn" onclick="this.closest('.auth-modal').remove()">✕</button>
        </div>
        
        <div id="chats-list">
          ${chats.length === 0 ? '<p class="empty-state">Aucune conversation</p>' : 
            chats.map(chat => {
              const otherParticipant = Object.entries(chat.participants || {})
                .find(([id]) => id !== state.uid)?.[1];
              
              return `
                <div class="chat-item" onclick="window.openChat('${chat.id}')">
                  <div class="chat-avatar">👤</div>
                  <div class="chat-info">
                    <div class="chat-name">${escapeHtml(otherParticipant?.username || 'Conversation')}</div>
                    <div class="chat-last-message">${escapeHtml(chat.lastMessage?.text?.substring(0, 50) || '')}</div>
                  </div>
                  <div class="chat-time">${new Date(chat.lastMessage?.timestamp || 0).toLocaleDateString('fr-FR')}</div>
                </div>
              `;
            }).join('')
          }
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  } catch (error) {
    alert('Erreur: ' + error.message);
  }
}

// Notifications button handler
document.getElementById('notifications-btn')?.addEventListener('click', showNotificationsModal);

async function showNotificationsModal() {
  const modal = document.createElement('div');
  modal.id = 'notifications-modal';
  modal.className = 'auth-modal';
  modal.innerHTML = `
    <div class="auth-container">
      <div class="auth-header">
        <h2>🔔 Notifications</h2>
        <button class="close-btn" onclick="this.closest('.auth-modal').remove()">✕</button>
      </div>
      <div id="notifications-list">
        <div class="loading">Chargement...</div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  loadNotifications();
}

async function loadNotifications() {
  const container = document.getElementById('notifications-list');
  if (!container) return;
  
  try {
    const notifSnap = await db.ref(`notifications/${state.uid}`)
      .orderByChild('timestamp')
      .limitToLast(20)
      .once('value');
    
    const notifs = [];
    notifSnap.forEach(child => {
      notifs.push({
        id: child.key,
        ...child.val()
      });
    });
    
    notifs.reverse();
    
    if (notifs.length === 0) {
      container.innerHTML = '<p class="empty-state">Aucune notification</p>';
      return;
    }
    
    container.innerHTML = notifs.map(notif => {
      const icons = {
        friend_request: '👥',
        friend_accepted: '✅',
        new_message: '💬',
        game_invite: '🎮',
        group_message: '💬'
      };
      
      return `
        <div class="notif-item ${notif.read ? '' : 'unread'}">
          <span class="notif-icon">${icons[notif.type] || '📢'}</span>
          <div class="notif-content">
            <div class="notif-text">${getNotificationText(notif)}</div>
            <div class="notif-time">${new Date(notif.timestamp).toLocaleString('fr-FR')}</div>
          </div>
        </div>
      `;
    }).join('');
    
    // Mark all as read
    const updates = {};
    notifs.forEach(notif => {
      if (!notif.read) {
        updates[`notifications/${state.uid}/${notif.id}/read`] = true;
      }
    });
    
    if (Object.keys(updates).length > 0) {
      await db.ref().update(updates);
    }
  } catch (error) {
    container.innerHTML = `<p class="error-state">Erreur: ${error.message}</p>`;
  }
}

function getNotificationText(notif) {
  switch (notif.type) {
    case 'friend_request':
      return `<strong>${escapeHtml(notif.fromUsername)}</strong> vous a envoyé une demande d'ami`;
    case 'friend_accepted':
      return `<strong>${escapeHtml(notif.fromUsername)}</strong> a accepté votre demande d'ami`;
    case 'new_message':
      return `<strong>${escapeHtml(notif.fromUsername)}</strong> vous a envoyé un message`;
    case 'game_invite':
      return `<strong>${escapeHtml(notif.fromUsername)}</strong> vous invite à jouer`;
    case 'group_message':
      return `Nouveau message dans un groupe`;
    default:
      return 'Nouvelle notification';
  }
}

// Game favorite/pin functionality
document.querySelectorAll('.favorite-btn').forEach((btn, idx) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const gameCard = btn.closest('.game-card');
    const game = gameCard.dataset.game;
    toggleFavorite(game, btn);
  });
});

document.querySelectorAll('.pin-btn').forEach((btn, idx) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const gameCard = btn.closest('.game-card');
    const game = gameCard.dataset.game;
    togglePin(game, btn);
  });
});

async function toggleFavorite(game, btn) {
  if (!state.uid) return;
  
  const favRef = db.ref(`users/${state.uid}/favoriteGames`);
  const snapshot = await favRef.once('value');
  const favorites = snapshot.val() || [];
  
  const index = favorites.indexOf(game);
  
  if (index > -1) {
    favorites.splice(index, 1);
    btn.classList.remove('active');
  } else {
    favorites.push(game);
    btn.classList.add('active');
  }
  
  await favRef.set(favorites);
  state.favoriteGames = favorites;
}

async function togglePin(game, btn) {
  if (!state.uid) return;
  
  const pinRef = db.ref(`users/${state.uid}/pinnedGames`);
  const snapshot = await pinRef.once('value');
  const pinned = snapshot.val() || [];
  
  const index = pinned.indexOf(game);
  
  if (index > -1) {
    pinned.splice(index, 1);
    btn.classList.remove('active');
  } else {
    if (pinned.length >= 3) {
      alert('Vous ne pouvez épingler que 3 jeux maximum');
      return;
    }
    pinned.push(game);
    btn.classList.add('active');
  }
  
  await pinRef.set(pinned);
  state.pinnedGames = pinned;
}

// Load user game preferences
async function loadGamePreferences() {
  if (!state.uid) return;
  
  const snapshot = await db.ref(`users/${state.uid}`).once('value');
  const userData = snapshot.val() || {};
  
  state.favoriteGames = userData.favoriteGames || [];
  state.pinnedGames = userData.pinnedGames || [];
  
  // Update UI
  state.favoriteGames.forEach(game => {
    const card = document.querySelector(`[data-game="${game}"]`);
    if (card) {
      card.querySelector('.favorite-btn')?.classList.add('active');
    }
  });
  
  state.pinnedGames.forEach(game => {
    const card = document.querySelector(`[data-game="${game}"]`);
    if (card) {
      card.querySelector('.pin-btn')?.classList.add('active');
    }
  });
}

// Online users counter
setInterval(async () => {
  try {
    const usersSnap = await db.ref('users').once('value');
    let onlineCount = 0;
    
    usersSnap.forEach(child => {
      if (child.val().status === 'online') {
        onlineCount++;
      }
    });
    
    document.getElementById('online-count').textContent = `👥 ${onlineCount} en ligne`;
  } catch (error) {
    console.error('Error counting online users:', error);
  }
}, 30000); // Update every 30 seconds

