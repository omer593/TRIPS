import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import TripsPage from "./pages/TripsPage";
import PlanTrip from "./pages/PlanTrip";
import AboutPage from "./pages/AboutPage";
import BookingPage from "./pages/BookingPage";
import ChatAssistant from "./pages/ChatAssistant";
import SavedTrips from "./pages/SavedTrips";
import Navbar from "./components/Navbar";
import './index.css';


function App() {
  const [userEmail, setUserEmail] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    setUserEmail(localStorage.getItem("userEmail"));
    setUserId(localStorage.getItem("userId"));
  }, []);

  return (
    <div className="app-container">
      <BrowserRouter>
        {/* Navbar קבוע בראש הדף */}
        <Navbar
          userEmail={userEmail}
          userId={userId}
          setUserEmail={setUserEmail}
          setUserId={setUserId}
        />
        
        {/* תוכן ראשי עם ריווחים נכונים */}
        <main className="page-container">
          <Routes>
            <Route path="/" element={<Navigate to="/trips" replace />} />
            <Route 
              path="/register" 
              element={
                <RegisterPage 
                  setUserEmail={setUserEmail}
                  setUserId={setUserId}
                />
              }
            />

            <Route
              path="/login"
              element={
                <LoginPage
                  setUserEmail={setUserEmail}
                  setUserId={setUserId}
                />
              }
            />
            <Route 
              path="/trips" 
              element={<PlanTrip />} 
            />
            <Route path="/plan/:routeId" element={<PlanTrip />} />
            <Route //למחוק
              path="/plantrip" 
              element={<PlanTrip />} 
            />
            <Route 
              path="/about" 
              element={<AboutPage />} 
            />
            <Route 
              path="/booking" 
              element={<BookingPage />} 
            />
            <Route path="/chat"
           element={<ChatAssistant />}
            />
            <Route path="/SavedTrips"
           element={<SavedTrips />}
            />
          </Routes>
          
        </main>
        
        {/* Footer אופציונלי */}
        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center space-x-4">
              <img
                src="/images/logo.png"
                alt="TripPlanner Logo"
                className="h-14 w-auto"
              />
              <p className="text-gray-500 text-sm">
                © TripPlanner - by Omer
              </p>
            </div>
          </div>
        </footer>

      </BrowserRouter>
    </div>
  );
}

export default App;