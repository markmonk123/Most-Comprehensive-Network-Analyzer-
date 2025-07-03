const { exec } = require("child_process");
const os = require("os");
const { validateIP } = require("./validate"); // Import validation
const { MongoClient } = require("mongodb");

// Local MAC lookup via ARP table

// Preprocess ARP table output using numpy (via Python) and store unique MACs and their counts in MongoDB
const getMacFromArp = async (ip) => {
  return new Promise((resolve, reject) => {
    if (!validateIP(ip)) {
      return reject("Invalid IP address.");
    }

    let arpCmd;
    const platform = os.platform();
    if (platform === "win32") {
      arpCmd = `arp -a ${ip}`;
    } else if (platform === "darwin") {
      arpCmd = `arp -n ${ip}`;
    } else if (platform === "linux") {
      arpCmd = "arp -a";
    } else {
      return reject("Unsupported OS for ARP lookup.");
    }

    exec(arpCmd, async (err, stdout) => {
      if (err) {
        return reject("Unable to retrieve ARP table.");
      }

      // Write ARP output to a temp file and call Python for numpy processing
      const fs = require('fs');
      const path = require('path');
      const tmpFile = path.join(__dirname, `arp_raw_${Date.now()}.txt`);
      fs.writeFileSync(tmpFile, stdout);

      // Python script to process ARP table with numpy
      const pyScript = `import sys\nimport numpy as np\nimport re\nfrom collections import Counter\n\nwith open(sys.argv[1]) as f:\n    data = f.read()\n\n# Extract MAC addresses\nmacs = re.findall(r'([0-9A-Fa-f]{2}(?:[:-][0-9A-Fa-f]{2}){5})', data)\nmacs = [m.lower() for m in macs]\nunique, counts = np.unique(macs, return_counts=True)\nfor u, c in zip(unique, counts):\n    print(f'{u},{c}')\n`;
      const pyPath = path.join(__dirname, 'arp_numpy_tmp.py');
      fs.writeFileSync(pyPath, pyScript);

      const { spawn } = require('child_process');
      const pyProc = spawn('python3', [pyPath, tmpFile]);
      let pyOut = '';
      pyProc.stdout.on('data', (data) => { pyOut += data.toString(); });
      pyProc.stderr.on('data', (data) => { /* ignore for now */ });
      pyProc.on('close', async () => {
        // Parse output: each line is mac,count
        const macCounts = pyOut.trim().split('\n').filter(Boolean).map(line => {
          const [mac, count] = line.split(',');
          return { mac, count: parseInt(count) };
        });

        // Store in MongoDB
        const mongoUrl = 'mongodb://localhost:27017';
        const dbName = 'ARPDB';
        const client = new MongoClient(mongoUrl);
        try {
          await client.connect();
          const db = client.db(dbName);
          const collection = db.collection('macAddresses');
          // Insert or update each mac address
          for (const entry of macCounts) {
            await collection.updateOne(
              { mac: entry.mac },
              { $set: { mac: entry.mac }, $inc: { count: entry.count } },
              { upsert: true }
            );
          }
        } catch (e) {
          // ignore db errors for now
        } finally {
          await client.close();
        }

        // Clean up temp files
        fs.unlinkSync(tmpFile);
        fs.unlinkSync(pyPath);

        // For this function, return the MAC for the requested IP if found
        let macAddress = null;
        const lines = stdout.split("\n");
        if (platform === "win32") {
          const entry = lines.find((line) => line.includes(ip));
          if (entry) {
            const parts = entry.trim().split(/\s+/);
            macAddress = parts[1] || null;
          }
        } else if (platform === "darwin") {
          const entry = lines.find((line) => line.includes(ip));
          if (entry) {
            const match = entry.match(/at ([0-9a-fA-F:]+)/);
            macAddress = match ? match[1] : null;
          }
        } else if (platform === "linux") {
          const entry = lines.find((line) => line.includes(ip));
          if (entry) {
            const match = entry.match(/at ([0-9a-fA-F:]+)/);
            macAddress = match ? match[1] : null;
          }
        }
        resolve(macAddress);
      });
    });
  });
};

module.exports = { getMacFromArp };