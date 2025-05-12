import { Router } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const apiKey = process.env.GOOGLE_API_KEY;

// ➡️ Новый роут для поиска магазинов
router.post('/nearby-stores', async (req, res) => {
  try {
    const { latitude, longitude, language = 'en' } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Missing latitude or longitude' });
    }

    const types = ['shopping_mall', 'clothing_store'];
    const radius = 3000;
    
    let allPlaces: any[] = [];

    for (const type of types) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&language=${language}&key=${apiKey}`;
      
      console.log('🌍 Запрос в Google:', url);

      const response = await fetch(url);
      const data = await response.json();

      if (data.results) {
        allPlaces.push(...data.results);
      }
    }

    const stores = allPlaces.map((place) => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity,
      distance: 0, // можно позже улучшить
      isOpen: place.opening_hours?.open_now,
      openingHoursText: place.opening_hours?.weekday_text?.join('\n'),
      rating: place.rating,
      placeID: place.place_id,
    }));

    return res.json({ stores });
  } catch (error) {
    console.error('❌ Ошибка в nearby-stores:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
