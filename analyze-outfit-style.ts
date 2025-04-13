import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

// Инициализация Gemini AI
const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) throw new Error('GOOGLE_API_KEY is not set in .env file');

const genAI = new GoogleGenerativeAI(apiKey);

// Функция для определения MIME-типа изображения
function getMimeType(url: string): string {
  const extension = url.split('.').pop()?.toLowerCase() || '';
  switch(extension) {
    case 'png': return 'image/png';
    case 'gif': return 'image/gif';
    case 'webp': return 'image/webp';
    default: return 'image/jpeg';
  }
}

// Основная функция анализа
export async function analyzeOutfitStyle({ photoUrl }: { photoUrl: string }) {
  console.log('\nStarting detailed outfit analysis for:', photoUrl);
  
  try {
    // 1. Загрузка изображения
    console.log('Downloading image...');
    const response = await axios.get(photoUrl, { 
      responseType: 'arraybuffer',
      timeout: 10000
    });
    const base64Image = Buffer.from(response.data).toString('base64');

    // 2. Настройка модели
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 3000
      }
    });

    // 3. Формирование промпта
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

    // 4. Отправка запроса
    console.log('Sending request to Gemini...');
    const result = await model.generateContent([
      { text: prompt },
      { 
        inlineData: {
          data: base64Image,
          mimeType: getMimeType(photoUrl)
        }
      }
    ]);

    // 5. Обработка ответа
    const analysisText = result.response.text();
    console.log('Raw analysis received:', analysisText);

    // 6. Форматирование ответа
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
    const sections = text.split('**').slice(1); // Разделяем по заголовкам
    
    for (let i = 0; i < sections.length; i += 2) {
      const title = sections[i].trim().replace(':', '');
      const content = sections[i+1]?.trim() || '';
      
      if (title && content) {
        // Специальная обработка для рекомендаций
        if (title.includes('Рекомендации')) {
          result.recommendations = content.split('*')
            .filter(item => item.trim().length > 0)
            .map(item => item.trim().replace(/^-\s*/, ''));
        } 
        // Обработка цветов
        else if (title.includes('Цветовая палитра')) {
          result.colors = content.split(':')[1]?.split(',')?.map(c => c.trim()) || [];
        }
        // Остальные разделы
        else {
          result[title] = content;
        }
      }
    }
    
    return result;
  }