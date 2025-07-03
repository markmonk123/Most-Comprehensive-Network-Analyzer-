const dgram = require('dgram');
const BROADCAST_ADDR = '127.0.0.1';
const PORT = 3000;
const MESSAGE = Buffer.from('Hello, is anyone listening?');

async function bindSocketWithRetry() {
  while (true) {
    const client = dgram.createSocket('udp4');
    try {
      await new Promise((resolve, reject) => {
        client.once('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            client.close();
            setTimeout(resolve, 1000); // Wait and retry
          } else {
            client.close();
            reject(err);
          }
        });
        client.bind(() => {
          client.removeAllListeners('error');
          resolve(client);
        });
      });
      return client;
    } catch (err) {
      console.error('Socket error:', err);
    }
  }
}

async function tryBroadcast() {
  let foundListener = false;

  let timeout = 2000; // Start with 2 seconds
  let attempt = 0;
  while (!foundListener) {
    const client = await bindSocketWithRetry();
    client.setBroadcast(true);

    client.send(MESSAGE, 0, MESSAGE.length, PORT, BROADCAST_ADDR, (err) => {
      if (err) {
        console.error('Send error:', err);
      } else {
        console.log('Broadcast sent, waiting for response...');
      }
    });

    // Define recognized ports and messages
    const recognizedPorts = [PORT];
    const recognizedMessages = [MESSAGE.toString()];

    // Helper regexes for suspicious content
    // IPv4: 1.2.3.4, IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334 or ::1
    const ipv4Regex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;
    const ipv6Regex = /\b([0-9a-fA-F]{1,4}:){1,7}[0-9a-fA-F]{1,4}\b|\b::1\b/;
    const macRegex = /([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/;
    const bssidRegex = /([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/; // BSSID is MAC format

    const { spawn } = require('child_process');

    client.on('message', (msg, rinfo) => {
      const msgStr = msg.toString();
      const isRecognizedPort = recognizedPorts.includes(rinfo.port);
      const isRecognizedMsg = recognizedMessages.includes(msgStr);
      let isSuspicious = false;

      // Flag if message is exactly -1
      if (msgStr.trim() === '-1') {
        isSuspicious = true;
      }

      // Flag if message is exactly 64 bytes
      if (msg.length === 64) {
        isSuspicious = true;
      }

      // Flag if message does not contain IPv4, IPv6, MAC, or BSSID
      if (!ipv4Regex.test(msgStr) && !ipv6Regex.test(msgStr) && !macRegex.test(msgStr) && !bssidRegex.test(msgStr)) {
        isSuspicious = true;
      }

      if (!isRecognizedPort || !isRecognizedMsg || isSuspicious) {
        console.warn(`Potentially malicious message detected from ${rinfo.address}:${rinfo.port}: ${msgStr}`);
        // Call malware_analyzer.py with the message and port as arguments
        const malwareProc = spawn('python3', ['malware_analyzer.py', msgStr, rinfo.port.toString()]);
        malwareProc.stdout.on('data', (data) => {
          console.log(`malware_analyzer.py output: ${data}`);
        });
        malwareProc.stderr.on('data', (data) => {
          console.error(`malware_analyzer.py error: ${data}`);
        });
      } else {
        console.log(`Received response from ${rinfo.address}:${rinfo.port}: ${msgStr}`);
        foundListener = true;
        client.close();
      }
    });

    // Wait a bit before retrying if no response, using progressive incremental timeout
    const currentTimeout = timeout * Math.pow(2, attempt);
    await new Promise((resolve) => setTimeout(resolve, currentTimeout));
    if (!foundListener) {
      client.close();
      attempt++;
    }
  }
  console.log('Listener found, exiting broadcast loop.');
}

tryBroadcast();