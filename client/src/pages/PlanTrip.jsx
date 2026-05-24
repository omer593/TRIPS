// PlanTrip.jsx 
import React, { useState } from "react";
import { getCoordinates } from "../utils/geocoding";
import { getWeatherForecast } from "../utils/weather";
import { getRandomImage } from "../utils/unsplash";

import SingleRouteMaps from "../components/SingleRouteMaps"; // ייבוא הקומפונט החדש
import "./PlanTrip.css";

function PlanTrip() {
  const [city, setCity] = useState("");
  const [tripType, setTripType] = useState("hiking");
  const [startDate, setStartDate] = useState(""); // תאריך התחלה
  const [endDate, setEndDate] = useState(""); // תאריך סיום
  const [plan, setPlan] = useState("");
  const [coordinates, setCoordinates] = useState([]);
  const [imageUrl, setImageUrl] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // States for saved routes functionality
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [routeName, setRouteName] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [showSavedRoutes, setShowSavedRoutes] = useState(false);

  // חישוב מספר הימים בטיול
  const calculateDays = () => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 כי נכלל גם היום האחרון
    return diffDays;
  };

  // קביעת מינימום תאריך להיום
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const fetchGROQPlan = async () => {
    const isHiking = tripType === "hiking";
    const actualDays = isHiking ? calculateDays() : 2; // רכיבה תמיד 2 ימים
    
    let prompt;
    if (isHiking) {
      prompt = `Create a detailed ${actualDays}-day hiking itinerary in ${city} starting from ${startDate} and ending on ${endDate}. 
      Each day should be a separate circular hiking route that starts and ends at the same point.
      Each day should include 3-5 specific locations/points of interest.
      Daily distance should be between 5-15 km.
      Format each day clearly as "Day X:" followed by the route details.
      Include specific place names, landmarks, and points of interest that exist in ${city}.
      Make sure each location name is clear and can be found on a map.`;
    } else {
      prompt = `Create a detailed 2-day cycling itinerary in ${city} starting from ${startDate} and ending on ${endDate}. 
      This should be a point-to-point cycling route from one city/area to another.
      Day 1: Start from ${city} and cycle to a nearby city/town (max 60km).
      Day 2: Continue cycling to another destination or return (max 60km).
      Include 3-4 specific locations/stops for each day.
      Format each day clearly as "Day X:" followed by the route details.
      Include specific place names, towns, and landmarks that exist in the region.
      Make sure each location name is clear and can be found on a map.`;
    }

    const apiKey = process.env.REACT_APP_GROQ_API_KEY;
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  };

  const extractLocationsFromText = (text) => {
    const lines = text.split("\n");
    const locations = [];
    
    // דפוסים לזיהוי מיקומים
    const patterns = [
      /\d+\.\s*([^:.\n]+?)(?:\s*[-:.]|$)/g, // "1. Location Name"
      /[-•]\s*([^:\n]+?)(?:\s*[-:.]|$)/g,   // "- Location Name"
      /(?:visit|stop at|go to|start from|end at)\s+([^,.\n]+)/gi, // "visit Location"
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:Park|Museum|Square|Bridge|Castle|Church|Market)/gi // "Location Name Park"
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const location = match[1].trim();
        if (location.length > 2 && location.length < 50) {
          // הוסף את שם העיר לכל מיקום לדיוק טוב יותר
          const fullLocation = `${location}, ${city}`;
          if (!locations.some(loc => 
            loc.toLowerCase().includes(location.toLowerCase()) ||
            location.toLowerCase().includes(loc.toLowerCase())
          )) {
            locations.push(fullLocation);
          }
        }
      }
    });
    
    // אם לא נמצאו מיקומים מספיק, נסה דפוס פשוט יותר
    if (locations.length < 2) {
      const words = text.split(/[\s,.-]+/);
      const capitalWords = words.filter(word => 
        /^[A-Z][a-z]{2,}$/.test(word) && 
        !['Day', 'Start', 'End', 'Visit', 'Stop', 'Go', 'From', 'To'].includes(word)
      );
      
      capitalWords.forEach(word => {
        if (locations.length < 10) {
          locations.push(`${word}, ${city}`);
        }
      });
    }
    
    return locations;
  };

  // פונקציה לקבלת תחזית מזג אוויר עבור תאריך ספציפי
  const getWeatherForDates = async (latitude, longitude) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tripStart = new Date(startDate);
      tripStart.setHours(0, 0, 0, 0);
      const daysDiff = Math.ceil((tripStart - today) / (1000 * 60 * 60 * 24));
      
      // קבל את התחזית הכללית
      const weatherData = await getWeatherForecast(latitude, longitude);
      
      if (daysDiff > 5) {
        // אם הטיול רחוק מדי, נציג מזג אוויר כללי למיקום
        return {
          ...weatherData,
          isGeneral: true,
          message: "תחזית כללית למיקום (הטיול מתוכנן לעוד יותר מ-5 ימים)"
        };
      } else {
        // אם הטיול קרוב, ניצור תחזית מותאמת לתאריכי הטיול
        if (weatherData && weatherData.list) {
          // צור רשימה של 3 הימים הראשונים של הטיול
          const tripForecast = [];
          const numDaysToShow = Math.min(3, calculateDays());
          
          for (let i = 0; i < numDaysToShow; i++) {
            const tripDate = new Date(startDate);
            tripDate.setDate(tripDate.getDate() + i);
            tripDate.setHours(12, 0, 0, 0); // קבע שעה קבועה לחיפוש
            
            // חפש את התחזית הקרובה ביותר לתאריך הטיול
            let closestForecast = weatherData.list[0];
            let minTimeDiff = Math.abs(new Date(weatherData.list[0].dt * 1000) - tripDate);
            
            weatherData.list.forEach(entry => {
              const forecastDate = new Date(entry.dt * 1000);
              const timeDiff = Math.abs(forecastDate - tripDate);
              if (timeDiff < minTimeDiff) {
                minTimeDiff = timeDiff;
                closestForecast = entry;
              }
            });
            
            // צור entry מותאם לתאריך הטיול
            const tripEntry = {
              ...closestForecast,
              dt: Math.floor(tripDate.getTime() / 1000), // שנה את הזמן לתאריך הטיול
              tripDayNumber: i + 1
            };
            
            tripForecast.push(tripEntry);
          }
          
          return {
            ...weatherData,
            list: tripForecast,
            isSpecific: true,
            message: `תחזית מזג אוויר עבור ${numDaysToShow} הימים הראשונים של הטיול`
          };
        }
        
        return weatherData;
      }
    } catch (error) {
      console.warn("Failed to get weather for specific dates:", error);
      return await getWeatherForecast(latitude, longitude);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setPlan("");
    setCoordinates([]);
    setWeather(null);
    setImageUrl(null);

    // ולידציה של תאריכים
    if (!startDate || !endDate) {
      setError("אנא הכנס תאריכי התחלה וסיום");
      setLoading(false);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      setError("תאריך ההתחלה לא יכול להיות בעבר");
      setLoading(false);
      return;
    }

    if (end < start) {
      setError("תאריך הסיום לא יכול להיות לפני תאריך ההתחלה");
      setLoading(false);
      return;
    }

    const days = calculateDays();
    if (tripType === "hiking" && days > 10) {
      setError("טיול הליכה יכול להיות עד 10 ימים לכל היותר");
      setLoading(false);
      return;
    }

    if (tripType === "bike" && days !== 2) {
      setError("טיול רכיבה חייב להיות בדיוק 2 ימים");
      setLoading(false);
      return;
    }

    try {
      // קבל את המסלול מ-GROQ
      const routeText = await fetchGROQPlan();
      if (!routeText) {
        throw new Error("לא התקבל מסלול מהשרת");
      }
      setPlan(routeText);

      // חלץ מיקומים מהטקסט
      const places = extractLocationsFromText(routeText);
      console.log("Extracted places:", places); // לבדיקה
      
      if (places.length === 0) {
        throw new Error("לא נמצאו מיקומים במסלול");
      }

      // קבל קואורדינטות לכל מיקום
      const coords = [];
      const maxLocations = tripType === 'bike' ? 8 : 12; // הגבל את מספר המיקומים
      
      for (let i = 0; i < Math.min(places.length, maxLocations); i++) {
        const place = places[i];
        try {
          const c = await getCoordinates(place);
          if (c && c.latitude && c.longitude) {
            coords.push({ name: place, ...c });
          }
        } catch (geoError) {
          console.warn(`Failed to get coordinates for ${place}:`, geoError);
          // המשך גם אם מיקום אחד נכשל
        }
        
        // הוסף עיכוב קטן בין בקשות גיאוקודינג
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (coords.length === 0) {
        throw new Error("לא ניתן למצוא קואורדינטות לאף מיקום במסלול");
      }

      console.log("Final coordinates:", coords); // לבדיקה
      setCoordinates(coords);

      // קבל מידע על מזג אויר ותמונה
      if (coords[0]) {
        try {
          const weatherData = await getWeatherForDates(coords[0].latitude, coords[0].longitude);
          setWeather(weatherData);
        } catch (weatherError) {
          console.warn("Failed to get weather:", weatherError);
        }

        try {
          const img = await getRandomImage(city);
          setImageUrl(img);
        } catch (imageError) {
          console.warn("Failed to get image:", imageError);
        }
      }
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      setError(err.message || "שגיאה ביצירת או עיבוד המסלול");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoute = async () => {
    if (!routeName.trim()) {
      setError("אנא הכנס שם למסלול");
      return;
    }

    if (!plan || coordinates.length === 0) {
      setError("אין מסלול לשמירה");
      return;
    }

    const userId = localStorage.getItem("userId"); // 💡 שליפת המשתמש המחובר

    if (!userId) {
      setError("לא נמצא משתמש מחובר. אנא התחבר מחדש.");
      return;
    }

    const newRoute = {
      name: routeName,
      city,
      tripType,
      days: calculateDays(),
      plan,
      coordinates,
      imageUrl,
      weather,
      startDate,     // ✅ תאריך התחלה
      endDate,       // ✅ תאריך סיום
      userId,        // ✅ המשתמש
    };

    try {
      const res = await fetch("http://localhost:5000/api/routes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRoute),
      });

      if (res.ok) {
        alert("המסלול נשמר לשרת בהצלחה! 🎉");
        setRouteName("");
        setShowSaveForm(false);
      } else {
        throw new Error("שגיאה בשמירת המסלול");
      }
    } catch (err) {
      console.error(err);
      setError("שגיאה בחיבור לשרת");
    }
  };

  // Load saved route
  const loadSavedRoute = (route) => {
    setCity(route.city);
    setTripType(route.tripType);
    setStartDate(route.startDate);
    setEndDate(route.endDate);
    setPlan(route.plan);
    setCoordinates(route.coordinates);
    setImageUrl(route.imageUrl);
    setWeather(route.weather);
    setShowSavedRoutes(false);
  };

  // Delete saved route
  const deleteSavedRoute = (routeId) => {
    setSavedRoutes(prev => prev.filter(route => route.id !== routeId));
  };

  // עדכון אוטומטי של תאריך הסיום כאשר משנים סוג טיול
  const handleTripTypeChange = (e) => {
    const newTripType = e.target.value;
    setTripType(newTripType);
    
    if (newTripType === 'bike' && startDate) {
      // עבור רכיבה, קבע אוטומטית סיום של יומיים
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + 1); // 2 ימים = יום התחלה + יום אחד
      setEndDate(end.toISOString().split('T')[0]);
    }
  };

  // עדכון תאריך סיום כאשר משנים תאריך התחלה עבור רכיבה
  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    
    if (tripType === 'bike' && newStartDate) {
      const start = new Date(newStartDate);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      setEndDate(end.toISOString().split('T')[0]);
    }
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: "'Segoe UI', 'Roboto', 'Arial', sans-serif",
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
    direction: 'ltr'
  };

  const headerStyle = {
    textAlign: 'center',
    color: '#2c3e50',
    marginBottom: '30px',
    fontSize: '2.8rem',
    fontWeight: '800',
    textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
    fontFamily: "'Segoe UI', 'Roboto', sans-serif",
    letterSpacing: '1px'
  };

  const cardStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    border: '1px solid #e9ecef'
  };

  const formStyle = {
    display: 'grid',
    gap: '20px'
  };

  const labelStyle = {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: '10px',
    display: 'block',
    fontFamily: "'Segoe UI', 'Roboto', sans-serif"
  };

  const inputStyle = {
    width: '100%',
    padding: '16px 20px',
    fontSize: '1.1rem',
    border: '2px solid #e9ecef',
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
    fontFamily: "'Segoe UI', 'Roboto', sans-serif",
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  };

  const buttonStyle = {
    width: '100%',
    padding: '18px',
    fontSize: '1.2rem',
    fontWeight: '700',
    backgroundColor: loading ? '#95a5a6' : '#3498db',
    color: '#ffffff',
    border: 'none',
    borderRadius: '16px',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 6px 20px rgba(52, 152, 219, 0.4)',
    marginTop: '15px',
    fontFamily: "'Segoe UI', 'Roboto', sans-serif",
    letterSpacing: '0.5px'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#27ae60',
    boxShadow: '0 6px 20px rgba(39, 174, 96, 0.4)',
    width: 'auto',
    padding: '12px 24px',
    fontSize: '1rem',
    margin: '0 8px 8px 0'
  };

  const dangerButtonStyle = {
    ...secondaryButtonStyle,
    backgroundColor: '#e74c3c',
    boxShadow: '0 6px 20px rgba(231, 76, 60, 0.4)'
  };

  const errorStyle = {
    backgroundColor: '#fee',
    color: '#d63384',
    padding: '18px',
    borderRadius: '12px',
    border: '2px solid #f5c6cb',
    marginBottom: '20px',
    fontWeight: '600',
    fontSize: '1.1rem',
    fontFamily: "'Segoe UI', 'Roboto', sans-serif",
    textAlign: 'center'
  };

  const imageStyle = {
    width: '100%',
    height: '300px',
    objectFit: 'cover',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
  };

  const weatherCardStyle = {
    ...cardStyle,
    background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
    color: '#ffffff'
  };

  const weatherListStyle = {
    listStyle: 'none',
    padding: '0',
    margin: '12px 0 0 0'
  };

  const weatherItemStyle = {
    padding: '16px 0',
    borderBottom: '1px solid rgba(255,255,255,0.2)',
    fontSize: '1.1rem',
    fontFamily: "'Segoe UI', 'Roboto', sans-serif",
    lineHeight: '1.6'
  };

  const planStyle = {
    backgroundColor: '#f8f9fa',
    padding: '24px',
    borderRadius: '16px',
    whiteSpace: 'pre-wrap',
    lineHeight: '2',
    fontSize: '1.1rem',
    color: '#2c3e50',
    border: '2px solid #e9ecef',
    fontFamily: "'Segoe UI', 'Roboto', monospace",
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    direction: 'ltr'
  };

  const sectionTitleStyle = {
    fontSize: '1.6rem',
    fontWeight: '800',
    color: '#2c3e50',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontFamily: "'Segoe UI', 'Roboto', sans-serif",
    letterSpacing: '0.5px'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    marginTop: '24px'
  };

  const savedRouteCardStyle = {
    ...cardStyle,
    backgroundColor: '#f8f9fa',
    border: '2px solid #e9ecef',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  };

  const topButtonsStyle = {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    flexWrap: 'wrap'
  };

  const dateRowStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px'
  };

  return (
    <div style={containerStyle}>
      <h1 style={headerStyle}>📍 Plan Your Trip</h1>

      <div style={cardStyle}>
        <div style={formStyle}>
          <div>
            <label style={labelStyle}>🏙️ City / Country:</label>
            <input
              style={inputStyle}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., Barcelona, Paris, Rome..."
              required
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            />
          </div>

          <div>
            <label style={labelStyle}>🚶 Trip Type:</label>
            <select
              style={inputStyle}
              value={tripType}
              onChange={handleTripTypeChange}
            >
              <option value="hiking">🥾 Hiking (5-15km per day, circular routes)</option>
              <option value="bike">🚴 Cycling (max 60km per day, 2 days point-to-point)</option>
            </select>
          </div>

          <div style={dateRowStyle}>
            <div>
              <label style={labelStyle}>📅 Start Date:</label>
              <input
                style={inputStyle}
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                min={getTodayString()}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>📅 End Date:</label>
              <input
                style={inputStyle}
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || getTodayString()}
                required
                disabled={tripType === 'bike'} // נוטרל עבור רכיבה כי הוא מתעדכן אוטומטית
              />
            </div>
          </div>

          {startDate && endDate && (
            <div style={{
              backgroundColor: tripType === 'bike' ? '#e3f2fd' : '#e8f5e8',
              padding: '16px',
              borderRadius: '12px',
              border: `2px solid ${tripType === 'bike' ? '#bbdefb' : '#c8e6c8'}`
            }}>
              <p style={{ margin: 0, color: tripType === 'bike' ? '#1565c0' : '#2d5a2d', fontWeight: '600' }}>
                📊 משך הטיול: {calculateDays()} ימים
                <br />
                {tripType === 'hiking' ? 
                  `🥾 כל יום יכלול מסלול מעגלי של 5-15 ק"מ שמתחיל ומסתיים באותה נקודה` :
                  `🚴 מסלול רכיבה של יומיים: מעיר לעיר עד 60 ק"מ ביום`
                }
              </p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !city.trim() || !startDate || !endDate}
            style={buttonStyle}
            onMouseOver={(e) => {
              if (!loading && city.trim() && startDate && endDate) {
                e.target.style.backgroundColor = '#2980b9';
                e.target.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseOut={(e) => {
              if (!loading && city.trim() && startDate && endDate) {
                e.target.style.backgroundColor = '#3498db';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            {loading ? "⏳ יוצר מסלול..." : "✨ Create Itinerary"}
          </button>
        </div>
      </div>

      {error && (
        <div style={errorStyle}>
          ❌ {error}
        </div>
      )}

      <div style={gridStyle}>
        {imageUrl && (
          <div style={cardStyle}>
            <h3 style={sectionTitleStyle}>🖼️ Destination Image</h3>
            <img src={imageUrl} alt={city} style={imageStyle} />
          </div>
        )}

        {weather?.list && (
          <div style={weatherCardStyle}>
            <h3 style={sectionTitleStyle}>
              ☁️ Weather Forecast
              {weather.isGeneral && <span style={{fontSize: '0.8rem', fontWeight: 'normal'}}> (כללי)</span>}
              {weather.isSpecific && <span style={{fontSize: '0.8rem', fontWeight: 'normal'}}> (לתאריכי הטיול)</span>}
            </h3>
            {weather.message && (
              <p style={{ fontSize: '0.9rem', marginBottom: '15px', opacity: 0.9 }}>
                ℹ️ {weather.message}
              </p>
            )}
            <ul style={weatherListStyle}>
              {weather.list.slice(0, 3).map((entry, i) => {
                const entryDate = new Date(entry.dt * 1000);
                let dateLabel;
                
                if (weather.isSpecific && entry.tripDayNumber) {
                  // אם זה תחזית ספציפית לטיול, הצג את התאריך בפורמט יפה עם מספר היום
                  dateLabel = `${entryDate.toLocaleDateString('he-IL')} (יום ${entry.tripDayNumber} בטיול)`;
                } else {
                  // תחזית כללית
                  dateLabel = entryDate.toLocaleDateString('he-IL');
                }
                
                return (
                  <li key={i} style={weatherItemStyle}>
                    📅 {dateLabel}
                    <br />
                    🌤️ {entry.weather[0].description} | 🌡️ {entry.main.temp.toFixed(1)}°C
                    {entry.main.feels_like && (
                      <>
                        <br />
                        🌡️ מרגיש כמו: {entry.main.feels_like.toFixed(1)}°C
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {plan && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={sectionTitleStyle}>🗺️ Recommended Itinerary</h2>
            <div>
              <button
                onClick={() => setShowSaveForm(!showSaveForm)}
                style={secondaryButtonStyle}
              >
                💾 שמור מסלול
              </button>
            </div>
          </div>

          {/* Save form */}
          {showSaveForm && (
            <div style={{
              backgroundColor: '#e8f5e8',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#2d5a2d' }}>💾 שמור את המסלול</h4>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  style={{
                    ...inputStyle,
                    width: '300px',
                    margin: '0'
                  }}
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  placeholder="הכנס שם למסלול..."
                />
                <button
                  onClick={handleSaveRoute}
                  style={secondaryButtonStyle}
                >
                  ✅ שמור
                </button>
                <button
                  onClick={() => setShowSaveForm(false)}
                  style={{
                    ...secondaryButtonStyle,
                    backgroundColor: '#95a5a6',
                    boxShadow: '0 6px 20px rgba(149, 165, 166, 0.4)'
                  }}
                >
                  ❌ ביטול
                </button>
              </div>
            </div>
          )}

          <div style={planStyle}>
            {plan}
          </div>
        </div>
      )}

      {/* הצגת המפה המאוחדת */}
      {coordinates.length > 0 && plan && (
        <div style={cardStyle}>
          <SingleRouteMaps 
            plan={plan}
            coordinates={coordinates}
            tripType={tripType}
            days={calculateDays()}
            city={city}
          />
        </div>
      )}
    </div>
  );
}

export default PlanTrip;