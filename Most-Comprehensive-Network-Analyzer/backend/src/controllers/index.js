// This file exports functions that handle incoming requests and responses for various API endpoints.

const { queryRIPEstat } = require('../services/ripeStatService');

const getIPData = async (req, res) => {
  const { ip } = req.params;
  try {
    const data = await queryRIPEstat(ip);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getIPData,
};