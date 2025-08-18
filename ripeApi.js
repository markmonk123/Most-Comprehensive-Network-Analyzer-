
const axios = require("axios");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const dbPath = path.join(__dirname, "ripestat_cache.db");
const db = new sqlite3.Database(dbPath);

// Ensure table exists
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS ripe_whois (
    ip TEXT PRIMARY KEY,
    whois TEXT
  )`);
});

// Query RIPEstat API for IP data

const queryRIPEstat = async (ip) => {
  // First, try to get from sqlite3 cache
  return new Promise((resolve, reject) => {
    db.get("SELECT whois FROM ripe_whois WHERE ip = ?", [ip], async (err, row) => {
      if (err) return reject(err);
      if (row) {
        // Return cached data
        
        try {
          const whois = JSON.parse(row.whois);
          return resolve({ ip, whois });
        } catch (e) {
          // If parsing fails, fall through to fetch
        }
      }
      // Not cached, fetch from RIPEstat
      try {
        const url = `https://stat.ripe.net/data/whois/data.json?resource=${ip}`;
        const response = await axios.get(url);
        if (response.data && response.data.data) {
          const whois = response.data.data.records || [];
          // Store in sqlite3
          db.run(
            "INSERT OR REPLACE INTO ripe_whois (ip, whois) VALUES (?, ?)",
            [ip, JSON.stringify(whois)],
            (err) => {
              if (err) console.error("SQLite insert error:", err);
            }
          );
          return resolve({ ip, whois });
        }
        throw new Error("RIPEstat returned incomplete data.");
      } catch (error) {
        return reject(new Error(`RIPEstat error: ${error.message}`));
      }
    });
  });
};

module.exports = { queryRIPEstat };