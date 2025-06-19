document.addEventListener('DOMContentLoaded', () => {
    // Ensure Firebase services are available (exposed from app.js)
    const auth = window.fb_auth;
    const db = window.fb_db;

    if (!auth || !db) {
        console.error('Firebase services (auth, db) not found. Ensure app.js loads first and exposes them.');
        alert('Critical error: Firebase services not loaded. App cannot function.');
        return;
    }

    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const errorMessage = document.getElementById('error-message');
    const signupErrorMessage = document.getElementById('signup-error-message');

    // Login event listener
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;

            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // Signed in 
                    console.log('User logged in:', userCredential.user.email);
                    if (errorMessage) errorMessage.textContent = '';
                    // app.js onAuthStateChanged will handle UI changes
                })
                .catch((error) => {
                    console.error('Login error:', error.code, error.message);
                    if (errorMessage) errorMessage.textContent = getFriendlyAuthErrorMessage(error);
                });
        });
    }

    // Signup event listener
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = signupForm['signup-email'].value;
            const password = signupForm['signup-password'].value;
            const role = signupForm['signup-role'].value;

            if (!role) {
                if (signupErrorMessage) signupErrorMessage.textContent = 'Please select a role.';
                return;
            }

            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // Signed up 
                    const user = userCredential.user;
                    console.log('User signed up:', user.email);
                    if (signupErrorMessage) signupErrorMessage.textContent = '';

                    // Create user document in Firestore
                    return db.collection('users').doc(user.uid).set({
                        email: user.email,
                        role: role,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                })
                .then(() => {
                    console.log('User role stored in Firestore.');
                    // app.js onAuthStateChanged will handle UI changes and role loading
                    // No need to redirect here, onAuthStateChanged will pick up the new user
                })
                .catch((error) => {
                    console.error('Signup error:', error.code, error.message);
                    if (signupErrorMessage) signupErrorMessage.textContent = getFriendlyAuthErrorMessage(error);
                });
        });
    }
});

function getFriendlyAuthErrorMessage(error) {
    switch (error.code) {
        case 'auth/invalid-email':
            return 'Invalid email address format.';
        case 'auth/user-disabled':
            return 'This user account has been disabled.';
        case 'auth/user-not-found':
            return 'No user found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password.';
        case 'auth/email-already-in-use':
            return 'This email address is already in use.';
        case 'auth/weak-password':
            return 'Password is too weak. It should be at least 6 characters.';
        case 'auth/operation-not-allowed':
            return 'Email/password accounts are not enabled. Contact support.';
        default:
            return 'An unknown error occurred. Please try again.';
    }
}
