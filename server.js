import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import config from './config/config.js';
import Journal from './src/models/Journal.js';
import journalRoutes from './src/routes/journal.js';

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// API Routes
app.use('/api/journal', journalRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(new URL('public/index.html', import.meta.url).pathname);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Initialize and start server
async function start() {
  try {
    await Journal.initDatabase();
    console.log('✅ Database initialized');

    app.listen(config.port, () => {
      console.log(`
╔════════════════════════════════════════╗
║   📔 MyWords - 750 Words Journal      ║
╚════════════════════════════════════════╝

✨ Server running: http://localhost:${config.port}
📝 API: http://localhost:${config.port}/api/journal
🏥 Health: http://localhost:${config.port}/api/health

🚀 Ready to save your thoughts!
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
