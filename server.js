const express = require("express");
const cors = require("cors");

const { queryRIPEstat } = require("./ripeApi");
const { getMacFromArp } = require("./arp");
const { performTraceroute } = require("./traceroute");
const { validateIP } = require("./validate");

const app = express();
app.use(express.json());
app.use(cors()); // Enable CORS for cross-origin requests

// Endpoint: Get MAC address from local ARP table
app.post("/api/mac", async (req, res) => {
  const { ip } = req.body;
  if (!ip || !validateIP(ip)) {
    return res.status(400).json({ error: "Invalid IP address." });
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

// Endpoint: Query RIPEstat API
app.post("/api/ripe", async (req, res) => {
  const { ip } = req.body;
  if (!ip || !validateIP(ip)) {
    return res.status(400).json({ error: "Invalid IP address." });
  }

  try {
    const data = await queryRIPEstat(ip);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Perform traceroute
app.post("/api/traceroute", async (req, res) => {
  const { ip } = req.body;
  if (!ip || !validateIP(ip)) {
    return res.status(400).json({ error: "Invalid IP address." });
  }

  try {
    const traceData = await performTraceroute(ip);
    res.json({ ip, trace: traceData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Server setup
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
``