
const { Client } = require('ssh2');
require('dotenv').config();
const net = require('net');

const config = {
    ssh: {
        host: process.env.REMOTE_SERVER_IP || '64.227.28.147',
        port: 22,
        username: process.env.REMOTE_SERVER_USER || 'root',
        password: process.env.REMOTE_SERVER_PASSWORD || 'Ojqemgeowt*a1'
    },
    tunnel: {
        localPort: 3308,
        remoteHost: '127.0.0.1', // Localhost relative to the remote server
        remotePort: 3306
    }
};

const sshClient = new Client();
const server = net.createServer(socket => {
    sshClient.forwardOut(
        '127.0.0.1',
        socket.remotePort,
        config.tunnel.remoteHost,
        config.tunnel.remotePort,
        (err, stream) => {
            if (err) {
                console.error('❌ SSH Forwarding Error:', err);
                socket.end();
                return;
            }
            socket.pipe(stream).pipe(socket);
        }
    );
});

sshClient.on('ready', () => {
    console.log('✅ SSH Connection Ready');

    server.listen(config.tunnel.localPort, () => {
        console.log(`✅ Tunnel Established: localhost:${config.tunnel.localPort} -> ${config.ssh.host}:${config.tunnel.remotePort}`);
        console.log('⏳ Keep this process running...');
    });
});

sshClient.on('error', (err) => {
    console.error('❌ SSH Error:', err);
    server.close();
});

sshClient.on('close', () => {
    console.log('Connection closed');
    server.close();
});

console.log(`Connecting SSH to ${config.ssh.host}...`);
try {
    sshClient.connect(config.ssh);
} catch (e) {
    console.error('Failed to connect:', e);
}
