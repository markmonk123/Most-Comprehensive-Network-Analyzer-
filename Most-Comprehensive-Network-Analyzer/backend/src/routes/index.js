// This file sets up the routing for the backend application, linking routes to their respective controller functions.

const express = require('express');
const router = express.Router();
const { getIPData } = require('../controllers/index');

// Define routes
router.get('/api/ip/:ip', getIPData);

module.exports = router;