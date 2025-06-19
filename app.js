// PASTE YOUR FIREBASE CONFIGURATION SNIPPET HERE:
const firebaseConfig = {
    apiKey: "AIzaSyCxoZlbj_6-UEJ6T6H2tnkKOp9ebX7YSrM",
    authDomain: "khan-firepos.firebaseapp.com",
    projectId: "khan-firepos",
    storageBucket: "khan-firepos.firebasestorage.app",
    messagingSenderId: "304752290702",
    appId: "1:304752290702:web:44108274f60cfbe26fd2df",
    measurementId: "G-SGMMWYK74F"
  };

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    const authContainer = document.getElementById('auth-container');
    const signupContainer = document.getElementById('signup-container');
    const mainContent = document.getElementById('main-content');
    const pageContent = document.getElementById('page-content'); // Where admin/cashier HTML will be loaded
    const userEmailDisplay = document.getElementById('user-email');
    const logoutButton = document.getElementById('logout-button');

    const showSignupLink = document.getElementById('show-signup');
    const showLoginLink = document.getElementById('show-login');

    // Toggle between login and signup forms
    if (showSignupLink) {
        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            authContainer.style.display = 'none';
            signupContainer.style.display = 'flex';
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            signupContainer.style.display = 'none';
            authContainer.style.display = 'flex';
        });
    }

    // Listen for auth state changes
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log('User logged in:', user.email);
            authContainer.style.display = 'none';
            signupContainer.style.display = 'none';
            mainContent.style.display = 'block';
            if (userEmailDisplay) userEmailDisplay.textContent = user.email;
            document.getElementById('app-container').classList.add('logged-in');
            
            // Fetch user role and load appropriate page
            await loadUserRoleAndContent(user);

        } else {
            console.log('User logged out');
            mainContent.style.display = 'none';
            authContainer.style.display = 'flex'; // Show login form
            signupContainer.style.display = 'none';
            if (pageContent) pageContent.innerHTML = ''; // Clear dynamic content
            if (userEmailDisplay) userEmailDisplay.textContent = '';
            document.getElementById('app-container').classList.remove('logged-in');
        }
    });

    // Logout button event listener
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            auth.signOut().catch(error => console.error('Logout error:', error));
        });
    }
});

async function loadUserRoleAndContent(user) {
    if (!user) return;
    const pageContent = document.getElementById('page-content');
    if (!pageContent) {
        console.error('page-content element not found');
        return;
    }

    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            const role = userData.role;
            console.log('User role:', role);

            if (role === 'admin') {
                loadPage('pages/admin.html', 'js/admin.js', pageContent);
            } else if (role === 'cashier') {
                loadPage('pages/cashier.html', 'js/cashier.js', pageContent);
            } else {
                pageContent.innerHTML = '<p>Role not assigned or unknown. Please contact support.</p>';
                console.error('Unknown or missing role for user:', user.uid);
            }
        } else {
            // This case might happen if user record in Firestore is not created immediately after signup
            // Or if a user is authenticated but has no role document (e.g. manual creation in Auth but not Firestore)
            pageContent.innerHTML = '<p>User profile not found. Please complete your registration or contact support.</p>';
            console.warn('User document not found in Firestore for UID:', user.uid);
            // Optionally, redirect to a profile completion page or show a message.
        }
    } catch (error) {
        console.error('Error fetching user role:', error);
        pageContent.innerHTML = '<p>Error loading user data. Please try again later.</p>';
    }
}

async function loadPage(htmlFile, jsFile, targetElement) {
    try {
        const response = await fetch(htmlFile);
        if (!response.ok) {
            throw new Error(`Failed to load ${htmlFile}: ${response.statusText}`);
        }
        const html = await response.text();
        targetElement.innerHTML = html;

        // Remove old script if it exists to prevent re-execution issues or multiple event listeners
        const oldScript = document.getElementById(jsFile.split('/').pop()); // e.g. admin.js
        if (oldScript) {
            oldScript.remove();
        }

        // Load new script
        const script = document.createElement('script');
        script.src = jsFile;
        script.id = jsFile.split('/').pop(); // Add an ID for easy removal
        script.defer = true; // Ensure HTML is parsed before script execution
        script.onload = () => {
            // Dispatch a custom event to signal that the page-specific script is loaded and ready.
            const eventName = `${jsFile.split('/')[1].split('.')[0]}PageReady`; // e.g., 'adminPageReady'
            document.dispatchEvent(new Event(eventName));
            console.log(`${jsFile} loaded and ${eventName} event dispatched.`);
        };
        document.body.appendChild(script);
    } catch (error) {
        console.error('Error loading page:', error);
        targetElement.innerHTML = `<p>Error loading content: ${error.message}. Please check console.</p>`;
    }
}

// Make Firebase services globally available if needed by other scripts, or pass them explicitly.
window.fb_auth = auth;
window.fb_db = db;
window.fb_storage = storage;
