import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000'; // Adjust the base URL as needed

export const fetchIPData = async (ip) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/ip/${ip}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching IP data: ${error.message}`);
  }
};

// Additional API functions can be added here as needed.