javascript
const { exec } = require("child_process");

// Local MAC lookup via ARP table
const getMacFromArp = async (ip) => {
  return new Promise((resolve, reject) => {
    exec("arp -a", (err, stdout) => {
      if (err) {
        return reject("Unable to retrieve ARP table.");
      }

      const lines = stdout.split("\n");
      const entry = lines.find((line) => line.includes(ip));

      if (!entry) {
        resolve(null);
      } else {
        const macAddress = entry.split(/\s+/)[2]; // Extract MAC
        resolve(macAddress);
      }
    });
  });
};

module.exports = { getMacFromArp };