import React, { useState } from 'react';
import axios from 'axios';

const NetworkAnalyzer = () => {
  const [ip, setIp] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const handleInputChange = (event) => {
    setIp(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setData(null);

    try {
      const response = await axios.get(`/api/analyze/${ip}`);
      setData(response.data);
    } catch (err) {
      setError('Error fetching data. Please try again.');
    }
  };

  return (
    <div>
      <h1>Network Analyzer</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={ip}
          onChange={handleInputChange}
          placeholder="Enter IP address"
          required
        />
        <button type="submit">Analyze</button>
      </form>
      {error && <p>{error}</p>}
      {data && (
        <div>
          <h2>Analysis Results for {data.ip}</h2>
          <pre>{JSON.stringify(data.whois, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default NetworkAnalyzer;