import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!;
const RADIUS = 1000;

interface Place {
  id: string;
  name: string;
  address: string;
  distance: number;
  isOpen?: boolean;
  openingHoursText: string;
  rating?: number;
  placeID: string;
  keyword: string; // 👈 добавляем сюда!
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371000; // Радиус Земли в метрах
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 🚩 Получение ближайших магазинов
// 🚩 Получение ближайших магазинов
router.post('/nearby-stores', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Coordinates are required' });
    }

    const keywords = [
      'fashion', 'clothing', 'boutique', 'shoes', 
      'footwear', 'sneakers', 'accessories', 
      'jewelry', 'bags', 'watches', 'hats', 
      'sunglasses', 'perfume', 'fragrance', 'cosmetics', 'beauty', 'sportwear'
    ];

    const allPlaces: Place[] = [];

    for (const keyword of keywords) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${RADIUS}&keyword=${encodeURIComponent(keyword)}&language=en&key=${GOOGLE_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      const places: Place[] = data.results.map((place: any) => ({
        id: place.place_id,
        name: place.name,
        address: place.vicinity,
        distance: Math.round(haversineDistance(
          latitude,
          longitude,
          place.geometry.location.lat,
          place.geometry.location.lng
        )),
        isOpen: place.opening_hours?.open_now,
        openingHoursText: place.opening_hours?.weekday_text?.join('\n') ?? '',
        rating: place.rating,
        placeID: place.place_id,
        keyword: keyword // <<< ЯВНО ДОБАВЛЯЕМ
      }));

      allPlaces.push(...places);
    }

    // Теперь правильно фильтруем без потери keyword:
    const uniqueMap = new Map<string, Place>();
    for (const place of allPlaces) {
      if (!uniqueMap.has(place.id)) {
        uniqueMap.set(place.id, place);
      }
    }
    const uniquePlaces = Array.from(uniqueMap.values());

    // 👈 здесь весь объект place сохраняется с keyword!

    return res.json({ stores: uniquePlaces });

  } catch (error) {
    console.error('❌ Ошибка сервера nearby-stores:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});


// router.post('/nearby-stores', async (req: Request, res: Response) => {
//   try {
//     const { latitude, longitude } = req.body;

//     if (!latitude || !longitude) {
//       return res.status(400).json({ error: 'Coordinates are required' });
//     }

//     const types = ['shopping_mall', 'clothing_store'];
//     const allPlaces: Place[] = [];

//     for (const type of types) {
//       const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${RADIUS}&type=${type}&language=en&key=${GOOGLE_API_KEY}`;
//       const response = await fetch(url);
//       const data = await response.json();

//       const places: Place[] = data.results.map((place: any) => {
//         const distance = place.geometry?.location
//           ? haversineDistance(
//               latitude,
//               longitude,
//               place.geometry.location.lat,
//               place.geometry.location.lng
//             )
//           : 0;

//         return {
//           id: place.place_id,
//           name: place.name,
//           address: place.vicinity,
//           distance: Math.round(distance),
//           isOpen: place.opening_hours?.open_now,
//           openingHoursText: place.opening_hours?.weekday_text?.join('\n') ?? '',
//           rating: place.rating,
//           placeID: place.place_id
//         };
//       });

//       allPlaces.push(...places);
//     }

//     return res.json({ stores: allPlaces });
//   } catch (error) {
//     console.error('❌ Ошибка сервера nearby-stores:', error);
//     return res.status(500).json({ error: 'Server error' });
//   }
// });


// Получение ссылки на место по placeID
router.post('/place-details', async (req: Request, res: Response) => {
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
