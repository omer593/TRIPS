const API_KEY = '0dbd70f8f87649339bfef57e91f1e006';

// פונקציה אסינכרונית שמביאה קואורדינטות לעיר מסוימת באמצעות OpenCage Geocoding API
export async function getCoordinates(city) {
  // URL הבקשה ל-OpenCage API
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(city)}&key=${API_KEY}&pretty=1&no_annotations=1`;

  try {
    // שליחת בקשה לשרת
    const response = await fetch(url);
    const data = await response.json();

    // אם התקבלו תוצאות – חילוץ הקואורדינטות
    if (data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry;
      return { latitude: lat, longitude: lng }; //  החזרת אובייקט עם קו רוחב וקו אורך
    } else {
      throw new Error('לא נמצאו תוצאות');
    }

  } catch (error) {
    // טיפול בשגיאה – החזרת null והדפסת הודעת שגיאה
    console.error('שגיאה בהמרת העיר:', error);
    return null;
  }
}



