// models/Route.js
const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  city: {
    type: String
  },
  tripType: {
    type: String,
    enum: ['hiking', 'bike']
  },
  days: {
    type: Number
  },
  plan: {
    type: String
  },
  coordinates: [
    {
      name: String,
      latitude: Number,
      longitude: Number
    }
  ],
  imageUrl: {
    type: String
  },
  weather: {
    type: mongoose.Schema.Types.Mixed // מאפשר לשמור אובייקט גמיש (או null)
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

module.exports = mongoose.model('Route', routeSchema);
