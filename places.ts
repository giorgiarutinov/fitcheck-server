import { Router } from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!;
const RADIUS = 3000; // 3 км радиус

router.post('/nearby-stores', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Coordinates are required' });
    }

    const types = ['shopping_mall', 'clothing_store'];
    let allPlaces: any[] = [];

    for (const type of types) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${RADIUS}&type=${type}&language=en&key=${GOOGLE_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      const places = data.results.map((place: any) => ({
        id: place.place_id,
        name: place.name,
        address: place.vicinity,
        distance: 0, // <-- Можно добавить отдельный расчет если хочешь
        isOpen: place.opening_hours?.open_now,
        openingHoursText: place.opening_hours?.weekday_text?.join('\n') ?? '',
        rating: place.rating
      }));

      allPlaces = allPlaces.concat(places);
    }

    return res.json(allPlaces); // ⬅️ ОТДАЕМ ЧИСТЫЙ МАССИВ []
  } catch (error) {
    console.error('❌ Ошибка сервера nearby-stores:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
