import { GoogleGenerativeAI } from '@google/generative-ai';

// Инициализация Gemini AI
const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) throw new Error('GOOGLE_API_KEY is not set in .env file');

const genAI = new GoogleGenerativeAI(apiKey);

// Основная функция анализа с base64
export async function analyzeOutfitStyleFromBase64(base64Image: string, mimeType = 'image/jpeg') {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { maxOutputTokens: 3000 }
    });

    const prompt = `
    Детально проанализируй наряд на фото. Ответ должен содержать:
    
    1. Верхняя одежда: [тип, цвет, фасон]
    2. Основной слой: [футболка/рубашка и т.д.]
    3. Низ: [брюки/юбка/шорты]
    4. Обувь: [тип, цвет]
    5. Аксессуары: [сумки, украшения, головные уборы]
    6. Общий стиль: [casual/formal/sporty/etc]
    7. Цветовая палитра: [основные цвета]
    8. Рекомендации по улучшению:
       - [совет 1]
       - [совет 2]
       - [совет 3]
    
    Будь максимально конкретным и детальным в описании.
    `;

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
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

// Парсер текстового ответа в структурированный объект
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
