// הגדרת המפתח של Unsplash דרך משתני סביבה
const UNSPLASH_ACCESS_KEY = process.env.REACT_APP_UNSPLASH_ACCESS_KEY;

// פונקציה אסינכרונית שמחזירה תמונה אקראית לפי מילת חיפוש מ-Unsplash
export async function getRandomImage(query) {
  try {
    // בדיקת תקינות של המפתח – אם לא הוגדר או אם עדיין ברירת מחדל
    if (!UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY.includes('הכנס')) {
      throw new Error('⚠️ UNSPLASH_ACCESS_KEY לא הוגדר כראוי!');
    }

    // קידוד מילת החיפוש ל-URL תקני
    const encodedQuery = encodeURIComponent(query);

    // בניית כתובת ה-API עם המפתח ומילת החיפוש
    const url = `https://api.unsplash.com/photos/random?query=${encodedQuery}&client_id=${UNSPLASH_ACCESS_KEY}&orientation=landscape`;

    console.log('📡 Fetching image from:', url); // למעקב

    // שליחת בקשה ל-Unsplash API
    const response = await fetch(url);

    // טיפול בשגיאה במקרה של הרשאה לא תקפה
    if (response.status === 403) {
      throw new Error('🚫 קיבלת 403 – כנראה שהמפתח שלך חסום או לא תקף.');
    } else if (!response.ok) {
      // שגיאות אחרות (כמו 500, 404 וכו')
      throw new Error(`❌ שגיאה: ${response.status} ${response.statusText}`);
    }

    // המרת התגובה ל-JSON
    const data = await response.json();

    // חילוץ כתובת התמונה (אם קיימת)
    const imageUrl = data.urls?.regular || null;

    if (!imageUrl) {
      throw new Error('🖼 לא נמצאה כתובת תמונה בתגובה');
    }

    // ✅ החזרת כתובת התמונה
    return imageUrl;

  } catch (error) {
    // טיפול בשגיאות והחזרת null
    console.error('❌ שגיאה בקבלת תמונה מ־Unsplash:', error.message);
    return null;
  }
}
