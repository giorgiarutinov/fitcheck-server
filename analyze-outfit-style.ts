import { GoogleGenerativeAI } from '@google/generative-ai';

// Инициализация Gemini AI
const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) throw new Error('GOOGLE_API_KEY is not set in .env file');

const genAI = new GoogleGenerativeAI(apiKey);

// Основная функция анализа с base64 и кастомным prompt
export async function analyzeOutfitStyleFromBase64(base64Image: string, mimeType = 'image/jpeg', prompt?: string) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { maxOutputTokens: 3000 }
    });

    // Если prompt не передан, используем дефолт на английском
    const finalPrompt = prompt?.trim().length
      ? prompt
      : `Analyze the outfit in the photo in detail. Include:
1. Outerwear: [type, color, style]
2. Base layer: [shirt/t-shirt etc.]
3. Bottom: [pants/skirt/shorts]
4. Footwear: [type, color]
5. Accessories: [bags, jewelry, hats]
6. Overall style: [casual/formal/sporty/etc]
7. Color palette: [main colors]
8. Suggestions to improve:
   - [tip 1]
   - [tip 2]
   - [tip 3]
Be specific and detailed.`;

    const result = await model.generateContent([
      { text: finalPrompt },
      {
        inlineData: {
          data: base64Image,
          mimeType
        }
      }
    ]);

    const analysisText = result.response.text();
    console.log('Raw analysis received:', analysisText);

    return {
      success: true,
      analysis: analysisText,
      structuredAnalysis: parseAnalysis(analysisText)
    };

  } catch (error) {
    console.error('Detailed analysis failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    };
  }
}

// Парсер ответа
function parseAnalysis(text: string) {
  const result: any = {};
  const sections = text.split('**').slice(1);

  for (let i = 0; i < sections.length; i += 2) {
    const title = sections[i].trim().replace(':', '');
    const content = sections[i + 1]?.trim() || '';

    if (title && content) {
      if (title.includes('Рекомендации')) {
        result.recommendations = content.split('*')
          .filter(item => item.trim().length > 0)
          .map(item => item.trim().replace(/^[-\s]*/, ''));
      } else if (title.includes('Цветовая палитра')) {
        result.colors = content.split(':')[1]?.split(',')?.map(c => c.trim()) || [];
      } else {
        result[title] = content;
      }
    }
  }

  return result;
}
