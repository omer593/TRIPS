// SingleRouteMaps.jsx - מפה אחת שמציגה את כל הימים בצבעים שונים 
import React, { useEffect, useRef } from 'react';

const SingleRouteMaps = ({ plan, coordinates, tripType, days, city }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);

  // צבעים שונים לכל יום
  const dayColors = [
    '#FF6B6B', // אדום
    '#4ECDC4', // טורקיז
    '#45B7D1', // כחול
    '#96CEB4', // ירוק בהיר
    '#FFEAA7', // צהוב
    '#DDA0DD', // סגול בהיר
    '#FF9A56', // כתום
    '#6C5CE7', // סגול כהה
    '#A8E6CF', // ירוק מנטה
    '#FFB3BA'  // ורוד
  ];

  // פונקציה משופרת לתקינות קואורדינטות -   
  const validateCoordinates = (coordinates) => {
    console.log("=== VALIDATE COORDINATES DEBUG ===");
    console.log("Raw input coordinates:", coordinates);
    console.log("Coordinates type:", typeof coordinates);
    console.log("Is array:", Array.isArray(coordinates));
    
    if (!coordinates || !Array.isArray(coordinates)) {
      console.warn("Coordinates is not an array:", coordinates);
      return [];
    }

    console.log("Original coordinates length:", coordinates.length);

    const validCoords = coordinates.map((coord, index) => {
      console.log(`Processing coordinate ${index}:`, coord);
      
      // בדיקות מקיפות יותר
      if (!coord) {
        console.warn(`Null/undefined coordinate at index ${index}:`, coord);
        return null;
      }

      // תמיכה בפורמטים שונים של קואורדינטות
      let lat, lng, name;
      
      if (typeof coord.latitude === 'number' && typeof coord.longitude === 'number') {
        lat = coord.latitude;
        lng = coord.longitude;
        name = coord.name;
        console.log(`Found latitude/longitude format at index ${index}: lat=${lat}, lng=${lng}`);
      } else if (typeof coord.lat === 'number' && typeof coord.lng === 'number') {
        lat = coord.lat;
        lng = coord.lng;
        name = coord.name;
        console.log(`Found lat/lng format at index ${index}: lat=${lat}, lng=${lng}`);
      } else if (typeof coord.lat === 'number' && typeof coord.lon === 'number') {
        lat = coord.lat;
        lng = coord.lon;
        name = coord.name;
        console.log(`Found lat/lon format at index ${index}: lat=${lat}, lng=${lng}`);
      } else if (Array.isArray(coord) && coord.length >= 2) {
        lat = coord[0];
        lng = coord[1];
        name = coord[2] || `מיקום ${index + 1}`;
        console.log(`Found array format at index ${index}: lat=${lat}, lng=${lng}`);
      } else {
        console.warn(`Invalid coordinate format at index ${index}:`, coord);
        return null;
      }

      // בדיקת תקינות הערכים
      if (isNaN(lat) || isNaN(lng)) {
        console.warn(`NaN coordinates at index ${index}:`, { lat, lng, original: coord });
        return null;
      }

      // בדיקת טווח תקין של קואורדינטות
      if (lat < -90 || lat > 90) {
        console.warn(`Invalid latitude at index ${index}:`, lat);
        return null;
      }

      if (lng < -180 || lng > 180) {
        console.warn(`Invalid longitude at index ${index}:`, lng);
        return null;
      }

      console.log(`Valid coordinate at index ${index}: lat=${lat}, lng=${lng}, name=${name}`);
      
      return {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        name: name || `מיקום ${index + 1}`,
        originalIndex: index,
        original: coord
      };
    }).filter(coord => coord !== null); // הסר נקודות לא תקינות

    console.log("Valid coordinates after filtering:", validCoords);
    console.log("Valid coordinates count:", validCoords.length);
    console.log("=== END VALIDATE COORDINATES DEBUG ===");
    
    return validCoords;
  };

  // פונקציה משופרת לחלוקת המיקומים לפי ימים
  const divideLocationsByDays = (validCoordinates) => {
    console.log("=== DIVIDE LOCATIONS DEBUG ===");
    console.log("Input validCoordinates:", validCoordinates);
    console.log("Input days:", days);
    
    if (!validCoordinates || validCoordinates.length === 0) {
      console.log("No valid coordinates for division");
      return [];
    }

    const totalDays = Math.max(parseInt(days) || 1, 1);
    console.log("Total days calculated:", totalDays);
    
    const dayRoutes = [];

    if (totalDays === 1) {
      // אם יום אחד, כל המיקומים ביום אחד
      dayRoutes.push({
        day: 1,
        locations: validCoordinates,
        color: dayColors[0]
      });
      console.log("Single day route created with all locations");
    } else {
      // חלוקה שווה של המיקומים לימים
      const locationsPerDay = Math.max(Math.ceil(validCoordinates.length / totalDays), 1);
      console.log("Locations per day:", locationsPerDay);

      for (let day = 0; day < totalDays; day++) {
        const startIndex = day * locationsPerDay;
        const endIndex = Math.min(startIndex + locationsPerDay, validCoordinates.length);
        const dayLocations = validCoordinates.slice(startIndex, endIndex);
        
        console.log(`Day ${day + 1}: taking locations from index ${startIndex} to ${endIndex-1}`);
        console.log(`Day ${day + 1} locations:`, dayLocations);
        
        if (dayLocations.length > 0) {
          dayRoutes.push({
            day: day + 1,
            locations: dayLocations,
            color: dayColors[day % dayColors.length]
          });
        }
        
        // אם הגענו לסוף הרשימה, עצור
        if (endIndex >= validCoordinates.length) {
          console.log(`Reached end of locations at day ${day + 1}`);
          break;
        }
      }
    }

    console.log("Final day routes:", dayRoutes);
    console.log("Total routes created:", dayRoutes.length);
    console.log("Total locations distributed:", dayRoutes.reduce((sum, route) => sum + route.locations.length, 0));
    console.log("=== END DIVIDE LOCATIONS DEBUG ===");
    
    return dayRoutes;
  };

  // ניקוי המפה
  const clearMap = () => {
    console.log("Clearing map - markers:", markersRef.current.length, "polylines:", polylinesRef.current.length);
    
    // נקה מרקרים
    markersRef.current.forEach((marker, index) => {
      if (mapInstanceRef.current && marker) {
        try {
          mapInstanceRef.current.removeLayer(marker);
          console.log(`Removed marker ${index}`);
        } catch (e) {
          console.warn("Error removing marker:", e);
        }
      }
    });
    markersRef.current = [];

    // נקה פולי-ליינים
    polylinesRef.current.forEach((polyline, index) => {
      if (mapInstanceRef.current && polyline) {
        try {
          mapInstanceRef.current.removeLayer(polyline);
          console.log(`Removed polyline ${index}`);
        } catch (e) {
          console.warn("Error removing polyline:", e);
        }
      }
    });
    polylinesRef.current = [];
  };

  // אתחול המפה
  useEffect(() => {
    console.log("=== MAP EFFECT TRIGGERED ===");
    console.log("Raw coordinates:", coordinates);
    console.log("Plan:", plan);
    console.log("Days:", days);
    console.log("Trip type:", tripType);

    // בדיקה אם Leaflet נטען
    if (!window.L) {
      console.error('Leaflet is not loaded - make sure to include Leaflet library');
      return;
    }

    // תקינות קואורדינטות
    const validCoordinates = validateCoordinates(coordinates);
    console.log("Valid coordinates after validation:", validCoordinates);

    if (validCoordinates.length === 0) {
      console.log("No valid coordinates, skipping map initialization");
      return;
    }

    const initMap = () => {
      console.log("Initializing map...");
      
      // אם המפה כבר קיימת, נקה אותה
      if (mapInstanceRef.current) {
        console.log("Clearing existing map");
        clearMap();
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // וודא שה-DOM element קיים
      if (!mapRef.current) {
        console.error("Map container element not found");
        return;
      }

      // מצא את המרכז הגיאוגרפי של כל המיקומים
      const latitudes = validCoordinates.map(c => c.latitude);
      const longitudes = validCoordinates.map(c => c.longitude);
      const centerLat = (Math.min(...latitudes) + Math.max(...latitudes)) / 2;
      const centerLng = (Math.min(...longitudes) + Math.max(...longitudes)) / 2;

      console.log("Map center:", centerLat, centerLng);
      console.log("Latitude range:", Math.min(...latitudes), "to", Math.max(...latitudes));
      console.log("Longitude range:", Math.min(...longitudes), "to", Math.max(...longitudes));

      // חישוב זום אוטומטי בהתבסס על טווח הקואורדינטות
      const latRange = Math.max(...latitudes) - Math.min(...latitudes);
      const lngRange = Math.max(...longitudes) - Math.min(...longitudes);
      const maxRange = Math.max(latRange, lngRange);
      
      let initialZoom = 12;
      if (maxRange > 10) initialZoom = 6;
      else if (maxRange > 5) initialZoom = 8;
      else if (maxRange > 1) initialZoom = 10;
      else if (maxRange > 0.1) initialZoom = 12;
      else initialZoom = 14;

      console.log("Range calculations - lat:", latRange, "lng:", lngRange, "max:", maxRange);
      console.log("Calculated zoom level:", initialZoom);

      // צור את המפה
      const map = window.L.map(mapRef.current, {
        center: [centerLat, centerLng],
        zoom: initialZoom,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true
      });

      // הוסף שכבת מפה - שימוש במספר providers לגיבוי
      const tileLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
        minZoom: 2
      });

      tileLayer.on('tileerror', function(error) {
        console.warn('Tile loading error:', error);
      });

      tileLayer.addTo(map);
      mapInstanceRef.current = map;
      console.log("Map created successfully");

      // חלק את המיקומים לימים
      const dayRoutes = divideLocationsByDays(validCoordinates);
      console.log("Day routes for map rendering:", dayRoutes);

      if (dayRoutes.length === 0) {
        console.error("No day routes found for mapping!");
        return;
      }

      // צור קבוצת גבולות לכל המיקומים
      const group = new window.L.featureGroup();
      let totalMarkersCreated = 0;
      let totalPolylinesCreated = 0;

      // צור מסלולים ומרקרים לכל יום
      dayRoutes.forEach((dayRoute, dayIndex) => {
        const { day, locations, color } = dayRoute;
        console.log(`Processing day ${day} with ${locations.length} locations, color: ${color}`);

        // צור פולי-ליין למסלול היום (רק אם יש יותר ממיקום אחד)
        if (locations.length > 1) {
          const routePath = locations.map(loc => [loc.latitude, loc.longitude]);
          console.log(`Creating polyline for day ${day}:`, routePath);

          try {
            const polyline = window.L.polyline(routePath, {
              color: color,
              weight: 4,
              opacity: 0.8,
              smoothFactor: 1
            }).addTo(map);

            polyline.bindPopup(`<div style="direction: rtl; text-align: center;">
              <strong>מסלול יום ${day}</strong><br>
              ${locations.length} עצירות
            </div>`);

            polylinesRef.current.push(polyline);
            group.addLayer(polyline);
            totalPolylinesCreated++;
            console.log(`Polyline created successfully for day ${day}`);
          } catch (error) {
            console.error(`Error creating polyline for day ${day}:`, error);
          }
        } else {
          console.log(`Day ${day} has only ${locations.length} location(s), skipping polyline`);
        }

      // צור מרקרים לכל מיקום - עם אייקון מפושט יותר
        locations.forEach((location, locIndex) => {
          console.log(`Creating marker for day ${day}, location ${locIndex + 1}/${locations.length}:`, location);
          
          try {
            // בדיקה נוספת של הקואורדינטות לפני יצירת המרקר
            if (!location || isNaN(location.latitude) || isNaN(location.longitude)) {
              console.error(`Invalid location data for marker day ${day}, location ${locIndex}:`, location);
              return;
            }

            // יצירת אייקון מפושט ובטוח יותר
            const isStartPoint = locIndex === 0;
            const markerNumber = isStartPoint ? day : locIndex + 1;
            
            // שימוש באייקון ברירת מחדל עם מספר
            const marker = window.L.marker([location.latitude, location.longitude]).addTo(map);

            // הוספת מספר ביום על המרקר באמצעות CSS
            const markerElement = marker._icon;
            if (markerElement) {
              markerElement.style.filter = `hue-rotate(${(day - 1) * 60}deg)`;
              markerElement.setAttribute('data-marker-number', markerNumber);
              markerElement.style.position = 'relative';
              
              // הוספת מספר על המרקר
              const numberDiv = document.createElement('div');
              numberDiv.innerHTML = markerNumber;
              numberDiv.style.cssText = `
                position: absolute;
                top: -5px;
                left: 50%;
                transform: translateX(-50%);
                background: ${color};
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                z-index: 1000;
              `;
              markerElement.appendChild(numberDiv);
            }

            // Popup עם פרטים על המיקום
            const popupContent = `
              <div style="direction: rtl; font-family: Arial; min-width: 200px;">
                <h4 style="margin: 0 0 8px 0; color: ${color}; font-size: 16px;">יום ${day}</h4>
                <p style="margin: 0; font-weight: bold; font-size: 14px;">${location.name || 'מיקום ללא שם'}</p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">
                  ${isStartPoint ? '🎯 נקודת התחלה' : `📍 עצירה ${locIndex + 1}`}
                </p>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #888;">
                  📍 ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}
                </p>
                <p style="margin: 4px 0 0 0; font-size: 10px; color: #999;">
                  מיקום מקורי: ${location.originalIndex + 1}
                </p>
              </div>
            `;

            marker.bindPopup(popupContent);
            markersRef.current.push(marker);
            group.addLayer(marker);
            totalMarkersCreated++;
            
            console.log(`Marker ${totalMarkersCreated} created successfully at [${location.latitude}, ${location.longitude}] for day ${day}`);
          } catch (error) {
            console.error(`Error creating marker for location ${locIndex} in day ${day}:`, error);
          }
        });
      });

      console.log(`Total markers created: ${totalMarkersCreated}, expected: ${validCoordinates.length}`);
      console.log(`Total polylines created: ${totalPolylinesCreated}`);

      // התאם את המפה לכל המיקומים - גישה משופרת
      console.log("Setting up map view...");
      console.log("Group layers count:", group.getLayers().length);
      
      if (group.getLayers().length > 0) {
        try {
          const bounds = group.getBounds();
          console.log("Calculated bounds:", bounds);
          console.log("Bounds details:", {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
          });
          
          // תמיד השתמש ב-fitBounds אם יש bounds תקינים
          if (bounds.isValid()) {
            map.fitBounds(bounds, { 
              padding: [30, 30],
              maxZoom: 14 
            });
            console.log("Bounds fitted successfully with fitBounds");
          } else {
            throw new Error("Invalid bounds calculated");
          }
        } catch (error) {
          console.error("Error with fitBounds, using manual calculation:", error);
          
          // חישוב ידני של הזום והמרכז
          const latitudes = validCoordinates.map(c => c.latitude);
          const longitudes = validCoordinates.map(c => c.longitude);
          
          const manualBounds = {
            minLat: Math.min(...latitudes),
            maxLat: Math.max(...latitudes),
            minLng: Math.min(...longitudes),
            maxLng: Math.max(...longitudes)
          };
          
          const manualCenterLat = (manualBounds.minLat + manualBounds.maxLat) / 2;
          const manualCenterLng = (manualBounds.minLng + manualBounds.maxLng) / 2;
          
          const latRange = manualBounds.maxLat - manualBounds.minLat;
          const lngRange = manualBounds.maxLng - manualBounds.minLng;
          const maxRange = Math.max(latRange, lngRange);
          
          let manualZoom = 13;
          if (maxRange > 10) manualZoom = 5;
          else if (maxRange > 5) manualZoom = 7;
          else if (maxRange > 2) manualZoom = 9;
          else if (maxRange > 1) manualZoom = 11;
          else if (maxRange > 0.5) manualZoom = 12;
          else if (maxRange > 0.1) manualZoom = 13;
          else manualZoom = 14;
          
          console.log("Manual calculation:", {
            center: [manualCenterLat, manualCenterLng],
            zoom: manualZoom,
            range: maxRange,
            bounds: manualBounds
          });
          
          map.setView([manualCenterLat, manualCenterLng], manualZoom);
        }
      } else {
        console.warn("No layers in group - using original center calculation");
        map.setView([centerLat, centerLng], initialZoom);
      }
      
      // וידוא שהמפה מרענפת נכון
      setTimeout(() => {
        console.log("Invalidating map size after setup");
        map.invalidateSize();
      }, 200);

      console.log("Map initialization completed successfully");
      console.log(`Final state: ${markersRef.current.length} markers and ${polylinesRef.current.length} polylines`);
    };

    // הפעל את האתחול מיידית
    initMap();
    // ניקוי בעת ביטול הקומפוננט
    return () => {
      clearMap();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coordinates, plan, tripType, days]); // dependencies

  // אם אין קואורדינטות
  const validCoordinates = validateCoordinates(coordinates);
  if (validCoordinates.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        <p>📍 לא נמצאו קואורדינטות תקינות להצגת מפה</p>
        <p style={{ fontSize: '0.9rem', color: '#999' }}>
          נא לוודא שהמיקומים מכילים latitude ו-longitude תקינים
        </p>
        {coordinates && coordinates.length > 0 && (
          <details style={{ marginTop: '10px', textAlign: 'left' }}>
            
            <pre style={{ fontSize: '0.8rem', background: '#f5f5f5', padding: '10px', borderRadius: '4px', maxHeight: '300px', overflow: 'auto' }}>
              {JSON.stringify(coordinates, null, 2)}
            </pre>
          </details>
        )}
      </div>
    );
  }

  const dayRoutes = divideLocationsByDays(validCoordinates);

  return (
    <div style={{ width: '100%' }}>
      {/* סטטיסטיקות  */}
      <div style={{ 
        marginBottom: '10px',
        padding: '10px',
        backgroundColor: '#e8f4f8',
        borderRadius: '8px',
        fontSize: '0.85rem',
        color: '#0c5460'
      }}>
        
         {/* {coordinates?.length || 0}   → 
        {validCoordinates.length}  → 
         {dayRoutes.length}  → 
         {dayRoutes.reduce((sum, route) => sum + route.locations.length, 0)} */}
      </div>

      <div style={{ 
        marginBottom: '20px',
        padding: '16px',
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
        border: '2px solid #e9ecef'
      }}>
        <h3 style={{ 
          margin: '0 0 15px 0',
          fontSize: '1.4rem',
          fontWeight: '700',
          color: '#2c3e50',
          textAlign: 'center'
        }}>
          🗺️ מפת המסלול המלאה - {city || 'טיול'}
        </h3>
        
        {/* מקרא צבעים */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          justifyContent: 'center',
          marginBottom: '15px'
        }}>
          {dayRoutes.map((dayRoute, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: `2px solid ${dayRoute.color}`,
              fontSize: '0.9rem',
              fontWeight: '600'
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: dayRoute.color,
                border: '2px solid #ffffff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}></div>
              יום {dayRoute.day} ({dayRoute.locations.length} עצירות)
            </div>
          ))}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          fontSize: '0.85rem',
          color: '#666'
        }}>
          <div>🎯 <strong>סה"כ מיקומים:</strong> {validCoordinates.length}</div>
          <div>📅 <strong>ימי טיול:</strong> {days || 1}</div>
          <div>🚶 <strong>סוג טיול:</strong> {tripType === 'hiking' ? 'הליכה' : 'רכיבה'}</div>
        </div>
      </div>

      {/* המפה */}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '600px',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          border: '1px solid #e9ecef',
          zIndex: 1,
          backgroundColor: '#f8f9fa' // רקע למקרה של טעינה
        }}
      />

      {/* רשימת המיקומים לפי ימים */}
      <div style={{ marginTop: '24px' }}>
        <h4 style={{
          fontSize: '1.3rem',
          fontWeight: '700',
          color: '#2c3e50',
          marginBottom: '16px'
        }}>
          📋 פירוט המסלול לפי ימים
        </h4>
        
        <div style={{
          display: 'grid',
          gap: '16px'
        }}>
          {dayRoutes.map((dayRoute, dayIndex) => (
            <div key={dayIndex} style={{
              padding: '16px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: `3px solid ${dayRoute.color}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <h5 style={{
                margin: '0 0 12px 0',
                fontSize: '1.1rem',
                fontWeight: '700',
                color: dayRoute.color,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: dayRoute.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {dayRoute.day}
                </div>
                יום {dayRoute.day} - {dayRoute.locations.length} עצירות
              </h5>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '8px'
              }}>
                {dayRoute.locations.map((location, locIndex) => (
                  <div key={locIndex} style={{
                    padding: '8px 12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      minWidth: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: dayRoute.color,
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {locIndex + 1}
                    </span>
                    {location.name ? location.name.replace(`, ${city}`, '') : `מיקום ${locIndex + 1}`}
                    <small style={{ color: '#666', marginRight: 'auto' }}>
                      ({location.latitude.toFixed(3)}, {location.longitude.toFixed(3)})
                      {location.originalIndex !== undefined && ` [מקורי: ${location.originalIndex + 1}]`}
                    </small>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* הודעה אם Leaflet לא נטען */}
      {!window.L && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          color: '#721c24'
        }}>
          ⚠️ <strong>שגיאה:</strong> Leaflet לא נטען. אנא ודא שהספרייה Leaflet כלולה בפרויקט שלך.
          <br />
          <small>הוסף את השורות הבאות ל-HTML head:</small>
          <pre style={{ fontSize: '0.8rem', marginTop: '8px', background: '#f1f1f1', padding: '8px', borderRadius: '4px' }}>
{`<link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>`}
          </pre>
        </div>
      )}
    </div>
  );
};

export default SingleRouteMaps;