import React from 'react';

// רכיב סטטי המציג עמוד עם קישורים להזמנת טיסות ומלונות
const BookingPage = () => {
  return (
    // עוטף את כל העמוד וממרכז את התוכן אנכית ואופקית
    <div className="flex items-center justify-center min-h-screen px-4 bg-gray-50">
      
      {/* קופסה לבנה עם צל, טקסט מרוכז, וריווח פנימי */}
      <div className="max-w-3xl text-center p-8 bg-white rounded-lg shadow-md text-gray-800">
        
        {/* כותרת ראשית של העמוד */}
        <h1 className="text-4xl font-bold mb-8 text-blue-700">
          Flight and hotel bookings
        </h1>

        {/* טקסט הסבר קצר מתחת לכותרת */}
        <p className="mb-6 text-lg">
          Here you can find links for booking flights and hotels, so you can
          easily and comfortably finalize your travel plans
        </p>

        {/* קישורים להזמנת טיסה ומלון – מוצגים בטור במסכים קטנים ובשורה במסכים רחבים */}
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          
          {/* כפתור להזמנת טיסה - פותח את Skyscanner בטאב חדש */}
          <a
            href="https://www.skyscanner.net/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg text-xl font-semibold hover:bg-blue-700 transition"
          >
            book flight
          </a>

          {/* כפתור להזמנת מלון - פותח את Booking.com בטאב חדש */}
          <a
            href="https://www.booking.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-green-600 text-white rounded-lg text-xl font-semibold hover:bg-green-700 transition"
          >
            book hotel
          </a>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
