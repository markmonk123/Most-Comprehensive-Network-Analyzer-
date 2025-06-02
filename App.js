import React, { useState } from "react";
import axios from "axios";

// Helper: Validate IP and block suspicious input
function isValidInput(ip) {
  if (
    typeof ip !== "string" ||
    ip.trim() === "" ||
    ip.length > 100 || // Prevent overly long input
    ip.match(/(http:\/\/|https:\/\/|ftp:\/\/|www\.)/i) || // Block URLs
    ip.match(/(POST|GET|PUT|DELETE|PATCH|HEAD|OPTIONS)\s/i) || // Block HTTP verbs
    ip.match(/(;|\||&&|`|\$\(.*\)|\bexec\b|\beval\b|\bimport\b|\brequire\b)/i) || // Block shell/code injection
    ip.match(/(select\s.+from|insert\s+into|update\s+\w+ set|delete\s+from|drop\s+table|union\s+select)/i) || // Block SQL injection
    ip.match(/\.\.(\/|\\)/) // Block directory traversal
  ) {
    return false;
  }
  // IPv4: 0-255.0-255.0-255.0-255
  const ipv4 =
    /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
  // IPv6: full/short, with optional subnet
  const ipv6 =
    /^([a-fA-F0-9]{1,4}:){1,7}[a-fA-F0-9]{1,4}(\/\d{1,3})?$|^::1(\/\d{1,3})?$|^([a-fA-F0-9]{1,4}:){1,7}:(\/\d{1,3})?$/;
  return ipv4.test(ip) || ipv6.test(ip);
}

function App() {
  const [ip, setIP] = useState("");
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const queryBackend = async (endpoint) => {
    setError(null);
    setResults(null);

    if (!isValidInput(ip)) {
      setError("Invalid or potentially dangerous input detected.");
      return;
    }

    try {
      const response = await axios.post(`http://localhost:3000/api/${endpoint}`, { ip });
      setResults(response.data);
      setError(null);
    } catch (err) {
      setError(`Error querying ${endpoint}: ${err.message}`);
    }
  };

  // Helper: Query RIPEstat Traceroute for v4<->v6
  const queryRipeTraceroute = async (fromVersion, toVersion) => {
    setError(null);
    setResults(null);

    if (!isValidInput(ip)) {
      setError("Invalid or potentially dangerous input detected.");
      return;
    }

    try {
      // RIPEstat traceroute API endpoint
      // Example: https://stat.ripe.net/data/traceroute/data.json?resource=8.8.8.8&source-app=your-app&target-version=6
      const url = `https://stat.ripe.net/data/traceroute/data.json?resource=${encodeURIComponent(
        ip
      )}&target-version=${toVersion}&source-app=network-analyzer-demo`;
      const response = await axios.get(url);
      setResults(response.data);
      setError(null);
    } catch (err) {
      setError(`Error querying RIPEstat traceroute: ${err.message}`);
    }
  };

  return (
    <div>
      <h1>Network Analyzer</h1>
      <input
        type="text"
        placeholder="Enter IP (IPv4/IPv6)"
        value={ip}
        onChange={(e) => setIP(e.target.value)}
      />
      <button onClick={() => queryBackend("mac")}>Get MAC</button>
      <button onClick={() => queryBackend("ripe")}>RIPEstat Data</button>
      <button onClick={() => queryBackend("traceroute")}>Traceroute</button>
      <button onClick={() => queryRipeTraceroute(4, 6)}>IPv4→IPv6 Traceroute</button>
      <button onClick={() => queryRipeTraceroute(6, 4)}>IPv6→IPv4 Traceroute</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {results && <pre>{JSON.stringify(results, null, 2)}</pre>}
    </div>
  );
}

export default App;