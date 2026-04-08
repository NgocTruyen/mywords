import * as User from '../models/User.js';

/**
 * Register a new user
 */
export async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const user = await User.registerUser(username, email, password);
    res.status(201).json({ 
      success: true, 
      message: 'User registered successfully',
      user 
    });
  } catch (error) {
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    next(error);
  }
}

/**
 * Login user
 */
export async function login(req, res, next) {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: 'Username/email and password are required' });
    }

    const result = await User.loginUser(usernameOrEmail, password);
    res.json({ 
      success: true, 
      message: 'Login successful',
      ...result 
    });
  } catch (error) {
    if (error.message.includes('credentials')) {
      return res.status(401).json({ error: error.message });
    }
    next(error);
  }
}

/**
 * Get current user info
 */
export async function getMe(req, res, next) {
  try {
    const user = await User.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
}

/**
 * Update password
 */
export async function changePassword(req, res, next) {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    await User.updatePassword(req.user.userId, newPassword);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete account
 */
export async function deleteAccount(req, res, next) {
  try {
    await User.deleteUser(req.user.userId);
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export default { register, login, getMe, changePassword, deleteAccount };
