
 const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;; 
// פונקציה אסינכרונית שמביאה תחזית מזג אוויר מ-OpenWeatherMap לפי קואורדינטות (קו רוחב ואורך)
export async function getWeatherForecast(lat, lon) {
  try {
    // יצירת URL עם פרמטרים:
    // lat & lon – קואורדינטות
    // units=metric – טמפרטורות במעלות צלזיוס
    // cnt=24 – 8 תחזיות ביום × 3 ימים = 24 (כל תחזית מייצגת 3 שעות קדימה)
    // appid – מפתח הגישה שלך ל־API
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&cnt=24&appid=${OPENWEATHER_API_KEY}`;

    // שליחת הבקשה ל־API
    const response = await fetch(url);

    // בדיקה אם הבקשה הצליחה
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }

    // המרת התשובה ל־JSON
    const data = await response.json();

    //  מחזיר את אובייקט התחזית (מכיל רשימת תחזיות לפי שעות, מידע על מיקום ועוד)
    return data;

  } catch (error) {
    // במקרה של שגיאה – הצגת השגיאה בקונסול והחזרת null
    console.error('Error fetching weather:', error);
    return null;
  }
}
