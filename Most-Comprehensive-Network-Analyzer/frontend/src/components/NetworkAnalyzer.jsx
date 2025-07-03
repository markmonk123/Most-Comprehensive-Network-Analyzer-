import React, { useState } from 'react';
import axios from 'axios';

// Helper: Check if input is a file type or suspicious payload
function isSuspiciousInput(ip) {
  // Check for file extensions or suspicious patterns
  const filePattern = /\.(exe|sh|bat|js|py|php|pl|rb|jar|bin|dll|scr|msi|vbs|cmd|com|cpl|pif|gadget|wsf|lnk|zip|tar|gz|rar|7z)$/i;
  const payloadPattern = /(payload|malware|virus|trojan|worm|exploit|shellcode)/i;
  return filePattern.test(ip) || payloadPattern.test(ip);
}

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

    // Check for file type or payload in input
    if (isSuspiciousInput(ip)) {
      // Log event to backend
      try {
        await axios.post('/api/log', { event: 'suspicious_input', value: ip });
      } catch (e) {
        // Optionally handle logging error
      }
      setError('Suspicious input detected. Data destroyed.');
      setIp('');
      return;
    }

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