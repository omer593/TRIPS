const express = require('express');
const User = require('../models/User');
const router = express.Router();

//  הרשמה
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });

    if (userExists) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const user = new User({
      name,
      email: email.toLowerCase(),
      password
    });

    const savedUser = await user.save();

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        _id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email
      }
    });
  } catch (error) {
    console.error('🔴 Registration error:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// התחברות 
router.post('/login', async (req, res) => {
  console.log('🎯 REACHED AUTH.JS LOGIN ROUTE');
  console.log('🔍 Login request received:', req.body);
  console.log('🛑🛑🛑 IF YOU SEE THIS, YOU ARE IN THE CORRECT LOGIN ROUTE 🛑🛑🛑');

  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    console.log('🔍 User found:', user ? `${user.email} (ID: ${user._id})` : 'No user found');

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isMatch = await user.matchPassword(password);
    console.log('🔍 Password match:', isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    console.log('🔥 Login successful for user:', user.email);
    
    // החזרת הנתונים המלאים
    return res.status(200).json({
      message: 'Login successful',
      userId: user._id, //  הוספת userId ישירות
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('🔴 Login error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

module.exports = router;