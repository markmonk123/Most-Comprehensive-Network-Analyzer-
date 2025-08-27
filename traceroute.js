const Traceroute = require("traceroute-lite");

// Perform traceroute for an IP address
const performTraceroute = async (ip) => {
  return new Promise((resolve, reject) => {
    const tracer = new Traceroute(ip);
    tracer.start((err, hops) => {
      if (err) {
        reject(new Error(`Traceroute error: ${err.message}`));
      } else {
        resolve(hops.map((hop, index) => ({ hop: index + 1, ...hop })));
      }
    });
  });
};

module.exports = { performTraceroute };
