const { exec } = require("child_process");
const os = require("os");

// Local MAC lookup via ARP table
const getMacFromArp = async (ip) => {
  return new Promise((resolve, reject) => {
    let arpCmd;
    const platform = os.platform();

    if (platform === "win32") {
      arpCmd = `arp -a ${ip}`;
    } else if (platform === "darwin" || platform === "linux") {
      arpCmd = "arp -a";
    } else {
      return reject("Unsupported OS for ARP lookup.");
    }

    exec(arpCmd, (err, stdout) => {
      if (err) {
        return reject("Unable to retrieve ARP table.");
      }

      const lines = stdout.split("\n");
      let macAddress = null;

      if (platform === "win32") {
        // Windows: IP address       Physical Address     Type
        //           192.168.1.1     00-11-22-33-44-55    dynamic
        const entry = lines.find((line) => line.includes(ip));
        if (entry) {
          const parts = entry.trim().split(/\s+/);
          macAddress = parts[1] || null;
        }
      } else if (platform === "darwin") {
        // macOS: ? (192.168.1.1) at 0:11:22:33:44:55 on en0 ifscope [ethernet]
        const entry = lines.find((line) => line.includes(ip));
        if (entry) {
          const match = entry.match(/at ([0-9a-fA-F:]+)/);
          macAddress = match ? match[1] : null;
        }
      } else if (platform === "linux") {
        // Linux: ? (192.168.1.1) at 00:11:22:33:44:55 [ether] on eth0
        const entry = lines.find((line) => line.includes(ip));
        if (entry) {
          const match = entry.match(/at ([0-9a-fA-F:]+)/);
          macAddress = match ? match[1] : null;
        }
      }

      resolve(macAddress);
    });
  });
};

module.exports = { getMacFromArp };