// MapView.jsx - כולל טעינת תמונות, תחזית ומפה אמיתית
import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCoordinates } from '../utils/geocoding';
import { getWeatherForecast } from '../utils/weather';
import { getRandomImage } from '../utils/unsplash';

// תיקון אייקונים של Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const FitBounds = ({ coordinates }) => {
  const map = useMap();
  useEffect(() => {
    if (coordinates.length > 0) {
      const group = new L.featureGroup(coordinates.map(c => L.marker([c.latitude, c.longitude])));
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [map, coordinates]);
  return null;
};

const SimpleRoute = ({ coordinates }) => {
  if (coordinates.length < 2) return null;
  const positions = coordinates.map(c => [c.latitude, c.longitude]);
  return <Polyline positions={positions} pathOptions={{ color: '#3388ff', weight: 4, opacity: 0.7, dashArray: '10, 10' }} />;
};

const AdvancedRouting = ({ coordinates }) => {
  const map = useMap();
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (coordinates.length < 2) {
      setRouteCoordinates([]);
      return;
    }
    const fetchRoute = async () => {
      setLoading(true);
      try {
        const waypoints = coordinates.map(c => `${c.longitude},${c.latitude}`).join(';');
        const url = `https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.routes?.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          setRouteCoordinates(coords);
        } else {
          setRouteCoordinates([]);
        }
      } catch (err) {
        console.error('Routing error:', err);
        setRouteCoordinates([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRoute();
  }, [coordinates]);

  if (loading) return <SimpleRoute coordinates={coordinates} />;
  if (routeCoordinates.length > 0) return <Polyline positions={routeCoordinates} pathOptions={{ color: '#ff6b35', weight: 4 }} />;
  return <SimpleRoute coordinates={coordinates} />;
};

const MapView = ({ destinations = [], showAdvancedRouting = true }) => {
  const [coordinates, setCoordinates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weather, setWeather] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageError, setImageError] = useState(null);

  const imageCache = useRef({});
  const prevDestinationsRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const coords = [];
        for (const dest of destinations) {
          const result = await getCoordinates(dest.name);
          if (result) coords.push({ ...dest, ...result });
        }
        setCoordinates(coords);

        if (coords.length > 0) {
          const first = coords[0].name;
          const prevFirst = prevDestinationsRef.current?.[0]?.name;
          const locationChanged = first !== prevFirst;
          const cachedImage = imageCache.current[first];

          if (!cachedImage || locationChanged || !imageUrl) {
            try {
              const img = await getRandomImage(first);
              if (!img) throw new Error('No image');
              imageCache.current[first] = img;
              setImageUrl(img);
            } catch (e) {
              console.error('Image fetch failed:', e);
              if (cachedImage) setImageUrl(cachedImage);
              else setImageUrl('/default.jpg'); // fallback
            }

            try {
              const weatherData = await getWeatherForecast(coords[0].latitude, coords[0].longitude);
              setWeather(weatherData);
            } catch (e) {
              console.error('Weather fetch error:', e);
            }
          } else {
            setImageUrl(cachedImage);
          }
        }

        prevDestinationsRef.current = [...destinations];
      } catch (e) {
        setError('שגיאה בטעינת מפה או תמונה');
      } finally {
        setLoading(false);
      }
    };
    if (destinations.length > 0) fetchData();
    else {
      setCoordinates([]);
      setImageUrl(null);
      setWeather(null);
      setLoading(false);
    }
  }, [destinations]);

  if (loading) return <div style={{ height: '400px' }}>🔄 טוען...</div>;
  if (error) return <div style={{ height: '400px', color: 'red' }}>{error}</div>;
  if (coordinates.length === 0) return <div style={{ height: '400px' }}>⚠️ אין יעדים</div>;

  const center = [coordinates[0].latitude, coordinates[0].longitude];

  return (
    <div>
      {imageUrl && (
        <div style={{ marginBottom: '10px' }}>
          <img src={imageUrl} alt={coordinates[0].name} style={{ width: '100%', borderRadius: '8px', height: '200px', objectFit: 'cover' }} />
        </div>
      )}
      {weather?.list && (
        <div style={{ background: '#e3f2fd', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
          <strong>☁️ תחזית:</strong>
          <ul>
            {weather.list.slice(0, 3).map((entry, i) => (
              <li key={i}>{new Date(entry.dt * 1000).toLocaleDateString()}: {entry.weather[0].description}, {entry.main.temp.toFixed(1)}°C</li>
            ))}
          </ul>
        </div>
      )}

      <MapContainer center={center} zoom={8} style={{ height: '400px', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
        <FitBounds coordinates={coordinates} />
        {coordinates.map((coord, index) => (
          <Marker key={index} position={[coord.latitude, coord.longitude]}>
            <Popup>
              <strong>{coord.name}</strong><br />({coord.latitude.toFixed(2)}, {coord.longitude.toFixed(2)})
            </Popup>
          </Marker>
        ))}
        {coordinates.length >= 2 && (
          showAdvancedRouting ? <AdvancedRouting coordinates={coordinates} /> : <SimpleRoute coordinates={coordinates} />
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;