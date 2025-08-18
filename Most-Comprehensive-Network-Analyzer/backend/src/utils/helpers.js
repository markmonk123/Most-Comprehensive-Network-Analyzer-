// This file contains utility functions that can be reused across the backend application for tasks such as data validation or formatting.

const validateIP = (ip) => {
  const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){2}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
};

const formatResponse = (data) => {
  return {
    success: true,
    data,
  };
};

const handleError = (error) => {
  return {
    success: false,
    message: error.message,
  };
};

module.exports = {
  validateIP,
  formatResponse,
  handleError,
};