import express from 'express';
import { analyzeOutfitStyle } from './analyze-outfit-style.js';
import cors from 'cors';
import dotenv from 'dotenv';
import { Request, Response } from 'express';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware для логирования всех запросов
app.use((req, res, next) => {
  console.log('\n=== NEW REQUEST ===');
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

app.use(cors());
app.use(express.json());

app.post('/analyze-style', async (req: Request<{}, {}, { photoUrl: string }>, res: Response) => {
  console.log('\nProcessing analyze request...');
  
  try {
    if (!req.body.photoUrl) {
      console.error('Error: photoUrl is required');
      return res.status(400).json({ 
        success: false,
        error: 'photoUrl is required' 
      });
    }

    console.log('Starting analysis for:', req.body.photoUrl);
    const result = await analyzeOutfitStyle(req.body);
    
    console.log('Analysis result:', result);
    res.json(result);
    
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server ready at http://localhost:${PORT}`);
  console.log('Current environment variables:', {
    PORT: process.env.PORT,
    API_KEY: process.env.GOOGLE_API_KEY ? 'AIzaSyAmnvggfmLcMIk8TudA0l9DDMJDJPCJZaM' : 'NOT SET'
  });
});
