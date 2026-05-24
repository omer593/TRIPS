import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SingleRouteMaps from "../components/SingleRouteMaps"; 

// קומפוננטת SavedTrips – אחראית להצגת המסלולים השמורים של המשתמש
function SavedTrips() {
  // מצב של כל המסלולים השמורים
  const [savedTrips, setSavedTrips] = useState([]);
  // טוען בזמן קבלת המסלולים מהשרת
  const [loading, setLoading] = useState(true);
  // שגיאות כלליות
  const [error, setError] = useState("");
  const [selectedTrip, setSelectedTrip] = useState(null); // מסלול שנבחר להצגה
  
  // מצבים לעריכת תאריכים
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [editedStartDate, setEditedStartDate] = useState("");
  const [editedEndDate, setEditedEndDate] = useState("");
  const [weatherLoading, setWeatherLoading] = useState(false);
  
  const navigate = useNavigate();

  //שליפת המסלולים של המשתמש
  useEffect(() => {
    const fetchSavedTrips = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setError("לא נמצא משתמש מחובר. אנא התחבר.");
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching trips for user:", userId);
        const res = await fetch(`http://localhost:5000/api/routes/user/${userId}`);
        if (!res.ok) {
          throw new Error(`שגיאה בטעינת המסלולים: ${res.status}`);
        }

        const data = await res.json();
        console.log("Received data:", data);
        setSavedTrips(data.routes || data || []);
      } catch (err) {
        console.error("Error fetching trips:", err);
        setError(err.message || "שגיאה בלתי צפויה");
      } finally {
        setLoading(false);
      }
    };

    fetchSavedTrips();
  }, []);

  // מחיקת מסלול לפי מזהה
  const handleDelete = async (routeId) => {
    if (!window.confirm("האם אתה בטוח שברצונך למחוק את המסלול?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/routes/${routeId}`, {
        method: "DELETE",
      });
      // סינון המסלול מהרשימה
      if (res.ok) {
        setSavedTrips((prev) => prev.filter((route) => route._id !== routeId));
        // אם המסלול שנמחק הוא זה שמוצג כרגע, חזור לרשימה
        if (selectedTrip && selectedTrip._id === routeId) {
          setSelectedTrip(null);
        }
      } else {
        throw new Error("שגיאה במחיקה");
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // פונקציה לעדכון מזג אוויר לפי תאריכים חדשים
  const fetchWeatherForNewDates = async (city, startDate, endDate) => {
    try {
      setWeatherLoading(true);
      
      const response = await fetch('http://localhost:5000/api/weather', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          city,
          startDate,
          endDate
        })
      });

      if (!response.ok) {
        throw new Error('שגיאה בקבלת מזג אוויר');
      }

      const weatherData = await response.json();
      return weatherData;
    } catch (error) {
      console.error('Error fetching weather:', error);
      return null;
    } finally {
      setWeatherLoading(false);
    }
  };

  // פונקציה לעדכון התאריכים בנתוני מזג האוויר
  const updateWeatherDates = (weatherData, newStartDate) => {
    if (!weatherData || !weatherData.list) return weatherData;
    
    const startDate = new Date(newStartDate);
    
    return {
      ...weatherData,
      list: weatherData.list.map((entry, index) => {
        const dayNumber = index + 1;
        const entryDate = new Date(startDate);
        entryDate.setDate(startDate.getDate() + index);
        
        return {
          ...entry,
          dt: Math.floor(entryDate.getTime() / 1000), // עדכון timestamp
          tripDayNumber: dayNumber,
          dateStr: entryDate.toISOString().split('T')[0]
        };
      }),
      isSpecific: true,
      message: `תחזית מזג אוויר עבור 3 הימים הראשונים החל מ-${formatDate(newStartDate)}`
    };
  };

  // פונקציה לשמירת תאריכים מעודכנים
  const handleSaveDates = async () => {
    if (!editedStartDate || !editedEndDate) {
      alert("אנא בחר תאריכי התחלה וסיום");
      return;
    }

    if (new Date(editedEndDate) < new Date(editedStartDate)) {
      alert("תאריך הסיום חייב להיות אחרי תאריך ההתחלה");
      return;
    }

    try {
      let updatedWeather = selectedTrip.weather;
      
      // עדכון מזג אוויר - נסה לקבל נתונים חדשים מהשרת
      const newWeatherFromServer = await fetchWeatherForNewDates(
        selectedTrip.city, 
        editedStartDate, 
        editedEndDate
      );

      if (newWeatherFromServer) {
        // אם קיבלנו נתונים חדשים מהשרת, השתמש בהם
        updatedWeather = newWeatherFromServer;
      } else if (selectedTrip.weather) {
        // אם לא, עדכן את התאריכים בנתונים הקיימים
        updatedWeather = updateWeatherDates(selectedTrip.weather, editedStartDate);
      }

      // עדכון המסלול עם התאריכים החדשים ומזג האוויר
      const updatedTrip = {
        ...selectedTrip,
        startDate: editedStartDate,
        endDate: editedEndDate,
        weather: updatedWeather
      };

      // שמירה בשרת
      const response = await fetch(`http://localhost:5000/api/routes/${selectedTrip._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: editedStartDate,
          endDate: editedEndDate,
          weather: updatedWeather
        })
      });

      if (response.ok) {
        // עדכון המצב המקומי
        setSelectedTrip(updatedTrip);
        setSavedTrips(prev => 
          prev.map(trip => 
            trip._id === selectedTrip._id 
              ? updatedTrip 
              : trip
          )
        );
        setIsEditingDates(false);
        alert("התאריכים ומזג האוויר עודכנו בהצלחה!");
      } else {
        throw new Error("שגיאה בשמירת התאריכים");
      }
    } catch (error) {
      console.error("Error updating dates:", error);
      alert("שגיאה בעדכון התאריכים: " + error.message);
    }
  };

  //  פונקציה להצגת המסלול השמור במלואו
  const viewTripDetails = (trip) => {
    setSelectedTrip(trip);
  };

  //  פונקציה לחזרה לרשימת המסלולים
  const backToList = () => {
    setSelectedTrip(null);
    setIsEditingDates(false);
  };

  // פונקציה להתחלת עריכת תאריכים
  const startEditDates = () => {
    setEditedStartDate(selectedTrip.startDate ? selectedTrip.startDate.split('T')[0] : '');
    setEditedEndDate(selectedTrip.endDate ? selectedTrip.endDate.split('T')[0] : '');
    setIsEditingDates(true);
  };

  // תרגום תאריך לתצוגה
  const formatDate = (dateStr) => {
    if (!dateStr) return "לא צוין";
    try {
      return new Date(dateStr).toLocaleDateString("he-IL");
    } catch (error) {
      return "תאריך לא תקין";
    }
  };

  // הצגת סוג טיול עם אייקון
  const getTripTypeDisplay = (tripType) => {
    switch (tripType) {
      case "hiking":
      case "hike":
        return "🥾 טיול רגלי";
      case "cycling":
      case "bike":
        return "🚴 רכיבה";
      case "driving":
      case "car":
        return "🚗 נהיגה";
      default:
        return `🎯 ${tripType || "לא צוין"}`;
    }
  };

  //פונקציה לחישוב מספר הימים ל-
  const calculateDays = (trip) => {
    if (trip.days) return trip.days; // אם כבר שמור
    
    if (!trip.startDate || !trip.endDate) return 1;
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
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

  const cardStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    border: '1px solid #e9ecef'
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

  const buttonStyle = {
    padding: '12px 20px',
    backgroundColor: '#3498db',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)',
    fontFamily: "'Segoe UI', 'Roboto', sans-serif"
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

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    marginTop: '24px'
  };

  // סגנון לשדות הקלט
  const inputStyle = {
    padding: '12px',
    border: '2px solid #e9ecef',
    borderRadius: '8px',
    fontSize: '1rem',
    fontFamily: "'Segoe UI', 'Roboto', sans-serif",
    width: '100%',
    marginBottom: '10px'
  };

  //  אם נבחר מסלול, הצג את הפרטים במקום הרשימה-
  if (selectedTrip) {
    return (
      <div style={containerStyle}>
        {/* כותרת עם כפתור חזרה */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "30px" }}>
          <button
            onClick={backToList}
            style={{
              ...buttonStyle,
              marginRight: "20px"
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#2980b9';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#3498db';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            ← חזור לרשימה
          </button>
          <h1 style={headerStyle}>
            {selectedTrip.name || "מסלול ללא שם"}
          </h1>
        </div>

        {/* פרטי המסלול */}
        <div style={cardStyle}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
            marginBottom: "20px"
          }}>
            <div>
              <h3 style={{ color: "#2c3e50", marginBottom: "10px" }}>📍 פרטי הטיול</h3>
              <p><strong>עיר:</strong> {selectedTrip.city}</p>
              <p><strong>סוג:</strong> {getTripTypeDisplay(selectedTrip.tripType)}</p>
              <p><strong>משך:</strong> {calculateDays(selectedTrip)} ימים</p>
            </div>
            
            <div>
              <h3 style={{ color: "#2c3e50", marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                📅 תאריכים
                {!isEditingDates && (
                  <button
                    onClick={startEditDates}
                    style={{
                      ...buttonStyle,
                      padding: "8px 12px",
                      fontSize: "0.9rem",
                      backgroundColor: "#27ae60"
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = '#219a52';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = '#27ae60';
                    }}
                  >
                    ✏️ ערוך
                  </button>
                )}
              </h3>
              
              {isEditingDates ? (
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                    תאריך התחלה:
                  </label>
                  <input
                    type="date"
                    value={editedStartDate}
                    onChange={(e) => setEditedStartDate(e.target.value)}
                    style={inputStyle}
                  />
                  
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                    תאריך סיום:
                  </label>
                  <input
                    type="date"
                    value={editedEndDate}
                    onChange={(e) => setEditedEndDate(e.target.value)}
                    style={inputStyle}
                  />
                  
                  <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                    <button
                      onClick={handleSaveDates}
                      disabled={weatherLoading}
                      style={{
                        ...buttonStyle,
                        backgroundColor: "#27ae60",
                        flex: 1
                      }}
                      onMouseOver={(e) => {
                        if (!weatherLoading) e.target.style.backgroundColor = '#219a52';
                      }}
                      onMouseOut={(e) => {
                        if (!weatherLoading) e.target.style.backgroundColor = '#27ae60';
                      }}
                    >
                      {weatherLoading ? "🔄 שומר ומעדכן מזג אוויר..." : "💾 שמור"}
                    </button>
                    <button
                      onClick={() => setIsEditingDates(false)}
                      style={{
                        ...buttonStyle,
                        backgroundColor: "#95a5a6",
                        flex: 1
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#7f8c8d';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = '#95a5a6';
                      }}
                    >
                      ❌ ביטול
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p><strong>התחלה:</strong> {formatDate(selectedTrip.startDate)}</p>
                  <p><strong>סיום:</strong> {formatDate(selectedTrip.endDate)}</p>
                </div>
              )}
            </div>
          </div>

          {selectedTrip.description && (
            <div style={{ marginTop: "20px" }}>
              <h3 style={{ color: "#2c3e50" }}>📝 תיאור</h3>
              <p style={{ lineHeight: "1.6", color: "#666" }}>{selectedTrip.description}</p>
            </div>
          )}
        </div>

        {/* גריד לתמונה ומזג אוויר - בסגנון PlanTrip */}
        <div style={gridStyle}>
          {/* תמונה */}
          {selectedTrip.imageUrl && (
            <div style={cardStyle}>
              <h3 style={sectionTitleStyle}>🖼️ Destination Image</h3>
              <img
                src={selectedTrip.imageUrl}
                alt={selectedTrip.city}
                style={imageStyle}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* מזג אויר */}
          {selectedTrip.weather?.list && (
            <div style={weatherCardStyle}>
              <h3 style={sectionTitleStyle}>
                ☁️ Weather Forecast
                {weatherLoading && (
                  <span style={{ fontSize: '1rem', marginLeft: '10px' }}>
                    🔄 מעדכן...
                  </span>
                )}
              </h3>
              {selectedTrip.weather.message && (
                <p style={{ fontSize: '0.9rem', marginBottom: '15px', opacity: 0.9 }}>
                  ℹ️ {selectedTrip.weather.message}
                </p>
              )}
              <ul style={weatherListStyle}>
                {selectedTrip.weather.list.slice(0, 3).map((entry, i) => {
                  const entryDate = new Date(entry.dt * 1000);
                  let dateLabel;
                  
                  if (selectedTrip.weather.isSpecific && entry.tripDayNumber) {
                    dateLabel = `${entryDate.toLocaleDateString('he-IL')} (יום ${entry.tripDayNumber} בטיול)`;
                  } else {
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

        {/* המסלול המלא */}
        {selectedTrip.plan && (
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>🗺️ Recommended Itinerary</h2>
            <div style={planStyle}>
              {selectedTrip.plan}
            </div>
          </div>
        )}

        {/* המפה - בדיוק כמו ב-PlanTrip */}
        {selectedTrip.coordinates && selectedTrip.coordinates.length > 0 && selectedTrip.plan && (
          <div style={cardStyle}>
            <SingleRouteMaps 
              plan={selectedTrip.plan}
              coordinates={selectedTrip.coordinates}
              tripType={selectedTrip.tripType}
              days={calculateDays(selectedTrip)}
              city={selectedTrip.city}
            />
          </div>
        )}
      </div>
    );
  }

  //  הרשימה הרגילה של המסלולים השמורים
  return (
    <div style={containerStyle}>
      <h1 style={headerStyle}>
        📂Your saved routes
      </h1>

      {loading ? (
        <div style={{ textAlign: "center", fontSize: "1.2rem", padding: "40px" }}>
          <div style={{...cardStyle, textAlign: "center"}}>
            🔄 Loading routes...
          </div>
        </div>
      ) : error ? (
        <div style={{
          backgroundColor: '#fee',
          color: '#d63384',
          padding: '18px',
          borderRadius: '12px',
          border: '2px solid #f5c6cb',
          marginBottom: '20px',
          fontWeight: '600',
          fontSize: '1.1rem',
          textAlign: 'center'
        }}>
          ❌ {error}
        </div>
      ) : savedTrips.length === 0 ? (
        <div style={{...cardStyle, textAlign: "center", padding: "40px"}}>
          <p style={{ fontSize: "1.2rem", color: "#666" }}>
            😕 No saved routes were found.
          </p>
          <p style={{ fontSize: "1rem", color: "#999", marginTop: "10px" }}>
            Create a new route on the 'Plan Trip' page and save it to see it here.
          </p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "24px",
          marginTop: "30px"
        }}>
          {savedTrips.map((trip, index) => (
            <div key={trip._id || trip.id || index} style={{
              background: "#fff",
              border: "1px solid #e9ecef",
              borderRadius: "16px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              overflow: "hidden",
              transition: "all 0.3s ease",
              cursor: "pointer"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)';
            }}
            >
              {trip.imageUrl && (
                <img
                  src={trip.imageUrl}
                  alt={trip.city || trip.name || "תמונת מסלול"}
                  style={{ width: "100%", height: "200px", objectFit: "cover" }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
              <div style={{ padding: "24px" }}>
                <h3 style={{ 
                  margin: "0 0 12px", 
                  color: "#2c3e50",
                  fontSize: "1.4rem",
                  fontWeight: "700"
                }}>
                  {trip.name || trip.title || "מסלול ללא שם"}
                </h3>
                
                {trip.city && (
                  <p style={{ margin: "8px 0", color: "#666", fontSize: "1rem" }}>
                    🏙️ {trip.city}
                  </p>
                )}
                
                <p style={{ margin: "8px 0", color: "#666", fontSize: "1rem" }}>
                  {getTripTypeDisplay(trip.tripType)} 
                  {` • ${calculateDays(trip)} ימים`}
                </p>
                
                {(trip.startDate || trip.endDate) && (
                  <p style={{ fontSize: "0.95rem", color: "#888", margin: "8px 0" }}>
                    🗓️ {formatDate(trip.startDate)} 
                    {trip.endDate && trip.startDate !== trip.endDate && 
                      ` - ${formatDate(trip.endDate)}`
                    }
                  </p>
                )}

                {trip.description && (
                  <p style={{ 
                    fontSize: "0.95rem", 
                    color: "#666", 
                    marginTop: "12px",
                    lineHeight: "1.5"
                  }}>
                    {trip.description.length > 120 
                      ? `${trip.description.substring(0, 120)}...` 
                      : trip.description
                    }
                  </p>
                )}

                <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                  <button
                    onClick={() => viewTripDetails(trip)}
                    style={{
                      flex: 1,
                      padding: "14px",
                      backgroundColor: "#3498db",
                      color: "#fff",
                      border: "none",
                      borderRadius: "12px",
                      cursor: "pointer",
                      fontSize: "1rem",
                      fontWeight: "600",
                      transition: "all 0.3s ease",
                      boxShadow: "0 4px 12px rgba(52, 152, 219, 0.3)"
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = "#2980b9";
                      e.target.style.transform = "translateY(-2px)";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = "#3498db";
                      e.target.style.transform = "translateY(0)";
                    }}
                  >
                    👁️ צפה במסלול
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(trip._id || trip.id);
                    }}
                    style={{
                      flex: 1,
                      padding: "14px",
                      backgroundColor: "#e74c3c",
                      color: "#fff",
                      border: "none",
                      borderRadius: "12px",
                      cursor: "pointer",
                      fontSize: "1rem",
                      fontWeight: "600",
                      transition: "all 0.3s ease",
                      boxShadow: "0 4px 12px rgba(231, 76, 60, 0.3)"
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = "#c0392b";
                      e.target.style.transform = "translateY(-2px)";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = "#e74c3c";
                      e.target.style.transform = "translateY(0)";
                    }}
                  >
                    🗑️ מחק
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SavedTrips;