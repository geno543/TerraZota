const API_URL = 'http://localhost:5000/api';

// Check if user is logged in
async function checkAuthStatus() {
    try {
        const response = await fetch(`${API_URL}/user`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (response.ok) {
            const data = await response.json();
            updateUI(true, data.user);
            return true;
        } else {
            updateUI(false);
            return false;
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        updateUI(false);
        return false;
    }
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/';
        } else {
            showError(data.error || 'Invalid email or password');
        }
    } catch (error) {
        console.error('Error during login:', error);
        showError('An error occurred during login. Please try again.');
    }
}

// Handle signup
async function handleSignup(event) {
    event.preventDefault();
    
    const fullname = document.getElementById('fullname').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ fullname, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/';
        } else {
            showError(data.error || 'Error creating account');
        }
    } catch (error) {
        console.error('Error during signup:', error);
        showError('An error occurred during signup. Please try again.');
    }
}

// Handle logout
async function handleLogout() {
    try {
        const response = await fetch(`${API_URL}/logout`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            localStorage.removeItem('user');
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Error during logout:', error);
    }
}

// Update UI based on auth status
function updateUI(isLoggedIn, user = null) {
    const loginBtn = document.querySelector('.login-btn');
    const userMenu = document.querySelector('.user-menu');
    
    if (isLoggedIn && user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (userMenu) {
            userMenu.style.display = 'flex';
            const userName = userMenu.querySelector('.user-name');
            if (userName) {
                userName.textContent = user.fullname;
            }
        }
    } else {
        if (loginBtn) loginBtn.style.display = 'block';
        if (userMenu) userMenu.style.display = 'none';
    }
}

// Show error message
function showError(message) {
    // Remove any existing error messages
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const form = document.querySelector('form');
    if (form) {
        form.insertBefore(errorDiv, form.firstChild);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const logoutBtn = document.querySelector('.logout-btn');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Initialize UI based on stored user data
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        const user = JSON.parse(storedUser);
        updateUI(true, user);
    }
    
    // Verify authentication status with server
    checkAuthStatus();
});
