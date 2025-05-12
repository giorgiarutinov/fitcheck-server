import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { analyzeOutfitStyleFromBase64 } from './analyze-outfit-style.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import placesRouter from './places'; // <-- Добавляем вверху

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ✅ Используем новый роут для магазинов
app.use('/', placesRouter);

// Logging middleware
app.use((req, res, next) => {
  console.log('\n=== NEW REQUEST ===');
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const trendModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// ✅ Универсальный обработчик анализа
app.post('/analyze-style', async (req, res) => {
  try {
    const { image, mimeType, trendy, query } = req.body;

    // 🎯 Обработка трендового текстового запроса
    if (trendy && query) {
  const lang = req.body.lang === 'ru' ? 'ru' : 'en';
  console.log(`✨ Трендовый запрос получен! Язык: ${lang}`);

  const prompt = lang === 'ru'
    ? `
Ты модный стилист. Ответь строго в JSON формате:

{
  "analysis": "Краткое описание модных трендов на сегодня.",
  "colors": [
    { "name": "название цвета", "hex": "#HEXCODE" },
    ...
  ],
  "brands": ["бренд1", "бренд2", "бренд3", "бренд4", "бренд5"]
}

Важно: hex должен быть валидным цветом в формате "#RRGGBB".

Вопрос: ${query}
`
    : `
You are a fashion stylist. Respond strictly in JSON format:

{
  "analysis": "Brief description of today's fashion trends.",
  "colors": [
    { "name": "color name", "hex": "#HEXCODE" },
    ...
  ],
  "brands": ["brand1", "brand2", "brand3", "brand4", "brand5"]
}

Important: hex must be valid in "#RRGGBB" format.

Question: ${query}
`;

  const result = await trendModel.generateContent([{ text: prompt }]);
  const text = result.response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return res.status(400).json({ error: 'JSON not found in response' });
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return res.json(parsed);
}

    // if (trendy && query) {
    //   console.log('✨ Трендовый запрос получен!');
    //   const prompt = `
    //     Ты модный стилист. Ответь строго в JSON формате:

    //     {
    //       "analysis": "Краткое описание модных трендов на сегодня.",
    //       "colors": [
    //     { "name": "название цвета", "hex": "#HEXCODE" },
    //     { "name": "название цвета", "hex": "#HEXCODE" },
    //       ...
    //     ]
    //     }

    //     Важно: hex должен быть валидным цветом в формате "#RRGGBB".

    //     Вопрос: ${query}
    //     `;

    //   // const prompt = `
    //   //   Отвечай строго в JSON формате:
    //   //   {
    //   //     "analysis": "Краткое описание модных трендов сегодня",
    //   //     "colors": ["цвет 1", "цвет 2", "цвет 3", "цвет 4", "цвет 5"]
    //   //   }

    //   //   Вопрос: ${query}
    //   // `;

    //   const result = await trendModel.generateContent([{ text: prompt }]);
    //   const text = result.response.text();

    //   const jsonMatch = text.match(/\{[\s\S]*\}/);
    //   if (!jsonMatch) {
    //     return res.status(400).json({ error: 'JSON not found in response' });
    //   }

    //   const parsed = JSON.parse(jsonMatch[0]);
    //   return res.json(parsed);
    // }

    // 📸 Обработка запроса с изображением
    // if (!image) {
    //   return res.status(400).json({ success: false, error: 'Image (base64) is required' });
    // }

    if (!image) {
      return res.status(400).json({ success: false, error: 'Image (base64) is required' });
    }

    // const result = await analyzeOutfitStyleFromBase64(image, mimeType);
    const result = await analyzeOutfitStyleFromBase64(image, mimeType, req.body.prompt); // <-- добавлено
    return res.json(result);

  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// 🚀 Запуск сервера
app.listen(PORT, () => {
  console.log(`\n🚀 Server ready at http://localhost:${PORT}`);
});

