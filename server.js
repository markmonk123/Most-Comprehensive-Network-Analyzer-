const express = require("express");
const cors = require("cors");
const maxmind = require("maxmind");
const axios = require("axios");
const path = require('path');
const { execFile } = require("child_process");

const { queryRIPEstat } = require("./ripeApi");
const { getMacFromArp } = require("./arp");
const { performTraceroute } = require("./traceroute");
const { validateIP } = require("./validate");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'Most-Comprehensive-Network-Analyzer/frontend/build')));

// Helper: Check for suspicious input (file types, payloads, etc.)
function isSuspiciousInput(ip) {
  const filePattern = /\.(exe|sh|bat|js|py|php|pl|rb|jar|bin|dll|scr|msi|vbs|cmd|com|cpl|pif|gadget|wsf|lnk|zip|tar|rar|7z)$/i;
  const payloadPattern = /(payload|malware|virus|trojan|worm|exploit|shellcode)/i;
  return filePattern.test(ip) || payloadPattern.test(ip);
}

// ML microservice integration
const analyzePayload = async (payload) => {
  try {
    const response = await axios.post('http://localhost:3000/analyze', { payload });
    return response.data.malicious;
  } catch (e) {
    // Fallback: treat as suspicious if ML service fails
    return true;
  }
};

// Log suspicious events
app.post('/api/log', (req, res) => {
  const { event, value } = req.body;
  console.log(`[LOG] Event: ${event}, Value: ${value}`);
  res.sendStatus(200);
});

// MAC address endpoint
app.post("/api/mac", async (req, res) => {
  const { ip } = req.body;
  if (!ip || !validateIP(ip)) {
    return res.status(400).json({ error: "Invalid IP address." });
  }
  if (isSuspiciousInput(ip)) {
    await axios.post('/api/log', { event: 'suspicious_input', value: ip });
    const isMalicious = await analyzePayload(ip);
    if (isMalicious) {
      return res.status(400).json({ error: "Malicious payload detected." });
    }
  }
  try {
    const mac = await getMacFromArp(ip);
    if (mac) {
      res.json({ ip, mac });
    } else {
      res.status(404).json({ error: `MAC address not found for IP: ${ip}` });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RIPEstat endpoint
app.post("/api/ripe", async (req, res) => {
  const { ip } = req.body;
  if (!ip || !validateIP(ip)) {
    return res.status(400).json({ error: "Invalid IP address." });
  }
  if (isSuspiciousInput(ip)) {
    await axios.post('/api/log', { event: 'suspicious_input', value: ip });
    const isMalicious = await analyzePayload(ip);
    if (isMalicious) {
      return res.status(400).json({ error: "Malicious payload detected." });
    }
  }
  try {
    const data = await queryRIPEstat(ip);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Traceroute endpoint with MaxMind GeoIP logging
app.post("/api/traceroute", async (req, res) => {
  const { ip } = req.body;
  if (!ip || !validateIP(ip)) {
    return res.status(400).json({ error: "Invalid IP address." });
  }
  if (isSuspiciousInput(ip)) {
    await axios.post('/api/log', { event: 'suspicious_input', value: ip });
    const isMalicious = await analyzePayload(ip);
    if (isMalicious) {
      return res.status(400).json({ error: "Malicious payload detected." });
    }
  }
  try {
    const traceData = await performTraceroute(ip);
    const lookup = await maxmind.open('./GeoLite2-City.mmdb');
    const traceWithGeo = traceData.map(hop => {
      const geo = hop.ip ? lookup.get(hop.ip) : null;
      console.log(`Hop: ${hop.ip || 'N/A'}, Geo: ${geo ? JSON.stringify(geo.city) : 'Unknown'}`);
      return { ...hop, geo };
    });
    res.json({ ip, trace: traceWithGeo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Example: analyze any suspicious input (can be used for other endpoints)
app.post("/api/analyze", async (req, res) => {
  const { ip } = req.body;
  if (isSuspiciousInput(ip)) {
    await axios.post('/api/log', { event: 'suspicious_input', value: ip });
    const isMalicious = await analyzePayload(ip);
    if (isMalicious) {
      return res.status(400).json({ error: "Malicious payload detected." });
    }
  }
  res.json({ status: "Input is properly formatted." });
});

// Analyze file for malware
app.post("/api/analyze-file", (req, res) => {
  const { filePath } = req.body;
  if (!filePath) return res.status(400).json({ error: "No file path provided." });

  const analyzerPath = path.join(__dirname, "malware_analyzer.py");
  execFile("python3", [analyzerPath, filePath], (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: stderr || error.message });
    }
    // Parse stdout for result
    if (stdout.includes("malicious")) {
      return res.json({ result: "malicious", details: stdout });
    }
    res.json({ result: "benign", details: stdout });
  });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'Most-Comprehensive-Network-Analyzer/frontend/build', 'index.html'));
});

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));