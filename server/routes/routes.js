const express = require('express');
const Route = require('../models/Route');
const router = express.Router();
const mongoose = require('mongoose');

// יצירת מסלול חדש


router.post('/create', async (req, res) => {
  const {
    name,
    city,
    tripType,
    days,
    plan,
    coordinates,
    imageUrl,
    weather,
    startDate,
    endDate,
    userId
  } = req.body;

  try {
    const route = new Route({
      name,
      city,
      tripType,
      days,
      plan,
      coordinates,
      imageUrl,
      weather,
      startDate,
      endDate,
      user: userId
    });

    await route.save();
    res.status(201).json({ message: 'Route created successfully', route });
  } catch (error) {
    res.status(500).json({ message: 'Error creating route', error });
  }
});

// קריאת מסלול לפי ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const route = await Route.findById(id).populate('user');
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }
    res.status(200).json(route);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving route', error });
  }
});


// קריאת כל המסלולים של משתמש לפי userId
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  
  // בדיקה אם ה-userId הוא ObjectId תקין
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }

  try {
    const routes = await Route.find({ user: userId });
    console.log(`Found ${routes.length} routes for user ${userId}`); //
    res.status(200).json({ routes });
  } catch (error) {
    console.error('Error fetching routes:', error); // 
    res.status(500).json({ message: 'Error fetching routes', error: error.message });
  }
});

// עדכון מסלול
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, startDate, endDate, destinations } = req.body;

  try {
    const route = await Route.findById(id);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    route.name = name || route.name;
    route.startDate = startDate || route.startDate;
    route.endDate = endDate || route.endDate;
    route.destinations = destinations || route.destinations;

    await route.save();
    res.status(200).json({ message: 'Route updated successfully', route });
  } catch (error) {
    res.status(500).json({ message: 'Error updating route', error });
  }
});

// מחיקת מסלול
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  try {
    const route = await Route.findById(id);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    await Route.findByIdAndDelete(id);
    res.status(200).json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Error deleting route:', error);
    res.status(500).json({ message: 'Error deleting route', error: error.message });
  }
});

module.exports = router;
