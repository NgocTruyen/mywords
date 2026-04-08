import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import config from '../../config/config.js';

let db = null;

const JWT_SECRET = config.jwtSecret || 'mywords-secret-key-change-in-production';
const SALT_ROUNDS = 10;

/**
 * Initialize users table
 */
export async function initUsersTable() {
  if (!db) {
    db = await open({
      filename: config.dbPath,
      driver: sqlite3.Database,
    });
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  return db;
}

/**
 * Register a new user
 */
export async function registerUser(username, email, password) {
  const database = db || await initUsersTable();

  // Check if user exists
  const existing = await database.get(
    'SELECT id FROM users WHERE username = ? OR email = ?',
    [username, email]
  );

  if (existing) {
    throw new Error('Username or email already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Insert user
  const now = new Date().toISOString();
  const result = await database.run(
    'INSERT INTO users (username, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [username, email, passwordHash, now, now]
  );

  return { id: result.lastID, username, email };
}

/**
 * Login user and return JWT token
 */
export async function loginUser(usernameOrEmail, password) {
  const database = db || await initUsersTable();

  // Find user by username or email
  const user = await database.get(
    'SELECT * FROM users WHERE username = ? OR email = ?',
    [usernameOrEmail, usernameOrEmail]
  );

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Verify password
  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    throw new Error('Invalid credentials');
  }

  // Generate JWT token
  const token = jwt.sign(
    { 
      userId: user.id, 
      username: user.username,
      email: user.email 
    },
    JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email
    }
  };
}

/**
 * Get user by ID
 */
export async function getUserById(userId) {
  const database = db || await initUsersTable();
  return await database.get('SELECT id, username, email, created_at FROM users WHERE id = ?', [userId]);
}

/**
 * Update user password
 */
export async function updatePassword(userId, newPassword) {
  const database = db || await initUsersTable();
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  const now = new Date().toISOString();

  await database.run(
    'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
    [passwordHash, now, userId]
  );
}

/**
 * Delete user
 */
export async function deleteUser(userId) {
  const database = db || await initUsersTable();
  await database.run('DELETE FROM users WHERE id = ?', [userId]);
}

export default {
  initUsersTable,
  registerUser,
  loginUser,
  getUserById,
  updatePassword,
  deleteUser
};
