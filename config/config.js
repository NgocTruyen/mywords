import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  host: 'localhost',
  dbPath: process.env.DB_PATH || path.join(__dirname, 'data', 'journal.db'),
  dataDir: path.join(__dirname, 'data'),
  publicDir: path.join(__dirname, 'public'),
};
