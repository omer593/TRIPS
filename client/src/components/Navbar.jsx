import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Navbar({ userEmail, userId, setUserEmail, setUserId }) {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    setUserEmail(null);
    setUserId(null);
    alert("התנתקת בהצלחה");
    navigate("/login");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow-lg border-b-2 border-blue-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo/Brand */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/">
              <img
                src="/images/logo.png"
                alt="TripPlanner Logo"
                className="h-14 w-auto mr-3"
              />
            </Link>
            <Link to="/" className="text-2xl font-bold text-blue-800 hover:text-blue-600 transition-colors duration-200">
              TripPlanner
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/SavedTrips" 
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-50"
            >
              MY TRIPS
            </Link>
            <Link 
              to="/about" 
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-50"
            >
              ABOUT
            </Link>
            <Link 
              to="/booking" 
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-50"
            >
              BOOKING
            </Link>
            <Link
              to="/chat"
              className="bg-cyan-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-cyan-500 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              CHAT WITH AI
            </Link>
            <Link 
              to="/PlanTrip" 
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              PLAN NEW TRIP
            </Link>
          </div>

          {/* User Section */}
          <div className="hidden md:flex items-center space-x-4">
            {userEmail ? (
              <>
                <span className="text-gray-700 text-sm bg-gray-100 px-3 py-2 rounded-lg">
                  👋 HELLO, {userEmail}
                </span>
                <button 
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-600 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  LOG OUT
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-50"
                >
                  LOG IN
                </Link>
                <Link 
                  to="/register" 
                  className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  REGISTER
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600 p-2 rounded-lg"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200 bg-white">
              <Link 
                to="/SavedTrips" 
                className="block text-gray-700 hover:text-blue-600 px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 hover:bg-blue-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                MY TRIPS
              </Link>
              <Link 
                to="/about" 
                className="block text-gray-700 hover:text-blue-600 px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 hover:bg-blue-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                ABOUT
              </Link>
              <Link 
                to="/booking" 
                className="block text-gray-700 hover:text-blue-600 px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 hover:bg-blue-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                BOOKING
              </Link>
              <Link 
                to="/chat" 
                className="block bg-cyan-600 text-white px-3 py-2 rounded-xl text-base font-medium hover:bg-cyan-500 transition-all duration-200 shadow-md text-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                CHAT WITH AI
              </Link>
              <Link 
                to="/PlanTrip" 
                className="block bg-blue-600 text-white px-3 py-2 rounded-xl text-base font-medium hover:bg-blue-700 transition-all duration-200 shadow-md text-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                PLAN NEW TRIP
              </Link>

              {userEmail ? (
                <>
                  <div className="px-3 py-2 text-gray-700 text-sm bg-gray-100 rounded-lg">
                    👋 שלום, {userEmail}
                  </div>
                  <button 
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left bg-red-500 text-white px-3 py-2 rounded-xl text-base font-medium hover:bg-red-600 transition-all duration-200 shadow-md"
                  >
                    LOGOUT
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="block text-gray-700 hover:text-blue-600 px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 hover:bg-blue-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    LOGIN
                  </Link>
                  <Link 
                    to="/register" 
                    className="block bg-green-600 text-white px-3 py-2 rounded-xl text-base font-medium hover:bg-green-700 transition-all duration-200 shadow-md text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    REGISTER
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
