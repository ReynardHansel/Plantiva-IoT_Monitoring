import net from 'net';
import { db } from '~/server/db';
import EventEmitter from 'events';

const TCP_PORT = 8080;
export const dataEventEmitter = new EventEmitter();

const server = net.createServer((socket) => {
  console.log('Client connected');

  socket.on('data', async (data) => {
    console.log('Received data:', data.toString());

    try {
      const parsedData = JSON.parse(data.toString());
      const savedData = await db.data.create({
        data: {
          temperature: parsedData.temperature,
          air_humidity: parsedData.air_humidity,
          ground_humidity: parsedData.ground_humidity,
          watered: parsedData.watered,
          fanned: parsedData.fanned,
        },
      });
      console.log('Data saved to database');
      dataEventEmitter.emit('newData', savedData);
    } catch (error) {
      console.error('Error saving data to database:', error);
    }
  });

  socket.on('end', () => {
    console.log('Client disconnected');
  });
});

export function startTcpServer() {
  server.listen(TCP_PORT, () => {
    console.log(`TCP server listening on port ${TCP_PORT}`);
  });
}