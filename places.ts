import { Router } from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!;
const RADIUS = 3000;

// Тип для места
interface Place {
  id: string;
  name: string;
  address: string;
  distance: number;
  isOpen?: boolean;
  openingHoursText: string;
  rating?: number;
  placeID: string;
}

// 🚩 Получение ближайших магазинов
router.post('/nearby-stores', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Coordinates are required' });
    }

    const types = ['shopping_mall', 'clothing_store'];
    const allPlaces: Place[] = [];

    for (const type of types) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${RADIUS}&type=${type}&language=en&key=${GOOGLE_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      const places: Place[] = data.results.map((place: any) => ({
        id: place.place_id,
        name: place.name,
        address: place.vicinity,
        distance: 0,
        isOpen: place.opening_hours?.open_now,
        openingHoursText: place.opening_hours?.weekday_text?.join('\n') ?? '',
        rating: place.rating,
        placeID: place.place_id
      }));

      allPlaces.push(...places);
    }

    return res.json({ stores: allPlaces });
  } catch (error) {
    console.error('❌ Ошибка сервера nearby-stores:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// 🚩 Получение ссылки на место по placeID
router.post('/place-details', async (req, res) => {
  try {
    const { placeId } = req.body;

    if (!placeId) {
      return res.status(400).json({ error: 'placeId is required' });
    }

    const encodedPlaceId = encodeURIComponent(placeId);
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodedPlaceId}&fields=url&key=${GOOGLE_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.result?.url) {
      return res.json({ url: data.result.url });
    } else {
      return res.status(404).json({ error: 'URL not found for this placeId' });
    }
  } catch (error) {
    console.error('❌ Ошибка сервера place-details:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
