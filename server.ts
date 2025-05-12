import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import placesRouter from './places.js'; // Маршрут для Google Places
import { analyzeOutfitStyleFromBase64 } from './analyze-outfit-style.js'; // Анализ фото

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/', placesRouter);

// 🔥 Минимальный роут для анализа текста
app.post('/analyze-style', async (req, res) => {
  try {
    const { trendy, query, image, mimeType } = req.body;

    if (trendy && query) {
      const result = await model.generateContent([{ text: query }]);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        return res.status(400).json({ error: 'JSON not found in response' });
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return res.json(parsed);
    }

    if (image) {
      const analysisResult = await analyzeOutfitStyleFromBase64(image, mimeType, req.body.prompt);
      return res.json(analysisResult);
    }

    return res.status(400).json({ error: 'Invalid request: no image or query provided' });

  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
