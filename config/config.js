import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Get project root directory (go up one level from config folder)
const configDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.dirname(configDir);

export default {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  host: 'localhost',
  dbPath: process.env.DB_PATH || path.join(projectRoot, 'data', 'journal.db'),
  dataDir: path.join(projectRoot, 'data'),
  publicDir: path.join(projectRoot, 'public'),
};
