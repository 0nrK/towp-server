import express, { Request, Response } from "express";
import dotenv from 'dotenv'
import cors from 'cors'
import QueueRoute from './routes/queueRoute'
import http from 'http';
import { Server } from "socket.io";
import EVENTS from "./constants/socketEvents";

const app = express();


const sockets: string[] = []
const playlist: string[] = ['asdsadasd']
const messageList: string[] = []
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    credentials: true,
    origin: '*'
  },
});

function socket({ io }: { io: Server }) {
  console.log(`Sockets enabled`);

  io.on(EVENTS.CONNECTION, (socket: any) => {
    console.log(`User connected ${socket.id}`);
    sockets.push(socket.id)
    socket.on(EVENTS.DISCONNECTION, (socket: any) => {
      console.log(`User disconnected ${socket.id}`);
      sockets.splice(sockets.indexOf(socket.id), 1)
    })
    socket.on(EVENTS.SERVER.GET_ROOM_MESSAGE, () => {
      console.log('asdsadsad')
    })
    socket.on('SEND_MESSAGE', (data: any) => {
      console.log(data)
      messageList.push(data)
      socket.emit('GET_MESSAGES', messageList)
    })
    socket.on('ADD_TO_PLAYLIST', (data: any) => {
      if (playlist.length < 20) {
        playlist.push(data)
        socket.emit('PLAYLIST', playlist)
      }else{
        socket.emit('FAIL', 'Playlist is full')
      }
      console.log(data)
    })
    // send playlist to the client
    socket.on('GET_PLAYLIST', () => {
      //send playlist to the user
      socket.emit('PLAYLIST', playlist)
    })
  });

}


socket({ io })

dotenv.config()
app.use(cors())
app.use('/api/queue', QueueRoute)

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});

server.listen(5000, () => console.log("Server listening on http://localhost:5000"));