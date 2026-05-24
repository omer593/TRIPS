# TripPlanner -Personal Trip Planner

#####
PLEASE WATCH THE POWERPOINT I ADDED BEFORE !!

## Project Description  
TripPlanner is a full-stack web application allowing registered users to plan travel routes, save them, view their trip history, and get weather forecasts.

## Core Requirements (MVP)

- User registration, login, logout with password hashing + salt  
- Private trips per user  
- Trip planning with maps (Leaflet), supporting bike and hiking trips  
- Saved trips list with route details  
- 3-day weather forecast for trip start location  
- Representative country image per trip  
- Responsive UI

## Technologies Used

- Frontend: React, HTML5, CSS3, JavaScript (ES6+)  
- Backend: Node.js, Express.js  
- Database: MongoDB  
- API: RESTful API  
- Maps: Leaflet.js  
- Weather:OPENWEATHER
- Picture: UNSPLASH
- GROQ: AI
- OPENCAGE : locations
- Security: Password hashing + salt  

## Project Structure
/server
    /models
    /routes
server.js

/client
    /src
        /components
        /pages
        /utils
App.js
index.js

## Installation and Running

1. Install dependencies:

```bash
cd server
npm install

cd ../client
npm install

## Create in /client/.env:

REACT_APP_UNSPLASH_ACCESS_KEY=your_api_key
REACT_APP_GROQ_API_KEY=your_api_key
REACT_APP_OPENCAGE_API_KEY=your_api_key

## Create in /server/.env:

MONGO_URI=your_mongodb_connection_string
PORT=5000

##  in src/utils/weather.js:

const OPENWEATHER_API_KEY = your_openweather_api_key

## run the project

cd server
node server.js

cd client
npm start


## Additional Notes
Passwords are securely stored using hashing and salting techniques.
Trips are private to each user and can only be viewed by their creator.
Weather forecasts are fetched live from the OpenWeather API.
Images are sourced from Unsplash.


## security and privacy
User passwords are securely stored using hashing and salting techniques to prevent unauthorized access. Each trip is private and accessible only to its creator, ensuring personal data is protected. All sensitive information is handled carefully, and API keys are stored securely in environment variables.

