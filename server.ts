// server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { analyzeOutfitStyle } from './analyze-outfit-style.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Logging Middleware
app.use((req, res, next) => {
  console.log('\n=== NEW REQUEST ===');
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// Analyze route
app.post('/analyze-style', async (req, res) => {
  try {
    const { photoUrl } = req.body;
    if (!photoUrl) {
      return res.status(400).json({ success: false, error: 'photoUrl is required' });
    }

    const result = await analyzeOutfitStyle({ photoUrl });
    res.json(result);
  } catch (error: any) {
    console.error('Server error:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server ready at http://localhost:${PORT}`);
});
