const traceroute = require("traceroute");

// Perform traceroute for an IP address
const performTraceroute = async (ip) => {
  return new Promise((resolve, reject) => {
    traceroute.trace(ip, (err, hops) => {
      if (err) {
        reject(new Error(`Traceroute error: ${err.message}`));
      } else {
        resolve(hops.map((hop, index) => ({ hop: index + 1, ...hop })));
      }
    });
  });
};

module.exports = { performTraceroute };