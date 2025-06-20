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

    client.on('message', (msg, rinfo) => {
      console.log(`Received response from ${rinfo.address}:${rinfo.port}: ${msg}`);
      foundListener = true;
      client.close();
    });

    // Wait a bit before retrying if no response
    await new Promise((resolve) => setTimeout(resolve, 2000));
    if (!foundListener) client.close();
  }
  console.log('Listener found, exiting broadcast loop.');
}

tryBroadcast();