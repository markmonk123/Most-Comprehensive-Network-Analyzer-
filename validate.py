const axios = require("axios");

// Query RIPEstat API for IP data
const queryRIPEstat = async (ip) => {
  try {
    const url = `https://stat.ripe.net/data/whois/data.json?resource=${ip}`;
    const response = await axios.get(url);

    if (response.data && response.data.data) {
      return { ip, whois: response.data.data.records || [] };
    }
    throw new Error("RIPEstat returned incomplete data.");
  } catch (error) {
    throw new Error(`RIPEstat error: ${error.message}`);
  }
};

module.exports = { queryRIPEstat };