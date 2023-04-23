import express, { NextFunction, Request, Response } from "express";
import dotenv from 'dotenv'
import cors from 'cors'
import http from 'http';
import { Server } from "socket.io";
import getVideoId from 'get-video-id';
import loaders from "./config/db";
import session from 'express-session'
import getYTVideoInfo from "./utils/yt";
import authRoute from './routes/authRoute'
import bodyParser from "body-parser";
import { IVideo } from "./types/Video";
import helmet from 'helmet'
import path from "path";
const app = express();

app.use(cors({
  origin: '*',
}))


dotenv.config()
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
); app.use(bodyParser.json())
app.use(
  session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false
  })
);
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
})


loaders()


const sockets: string[] = []
const playlist: IVideo[] = []
const messageList: string[] = []
const server = http.createServer(app);

app.get('/api/auth', authRoute)

const io = new Server(server, {
  cors: {
    credentials: true,
    origin: '*'
  },
});

function socket({ io }: { io: Server }) {
  console.log(`Sockets enabled`);

  io.on('connection', (socket: any) => {
    console.log(`User connected ${socket.id}`);
    sockets.push(socket.id)
    socket.on('disconnect', (socket: any) => {
      console.log(`User disconnected ${socket.id}`);
      sockets.splice(sockets.indexOf(socket.id), 1)
    })

    socket.on('SEND_MESSAGE', (data: any) => {
      messageList.push(data)
      socket.emit('GET_MESSAGES', messageList)
    })

    socket.on('VIDEO_END', (data: any) => {
      playlist.shift()
      socket.emit('CURRENT_VIDEO', playlist[0])
    })

    setInterval(() => {
      socket.emit('CURRENT_VIDEO', playlist[0])
    }, 3000)

    setInterval(() => {
      socket.emit('GET_MESSAGES', messageList)
    }, 1000)

    setInterval(() => {
      socket.emit('GET_PLAYLIST', playlist)
    }, 2000)

    socket.on('ADD_TO_PLAYLIST', async (data: any) => {
      if (playlist.length < 20) {
        const { id }: any = getVideoId(data)
        const { title } = await getYTVideoInfo(id)
        const thumbnail = `https://img.ytimg.com/vi/${id}/default.jpg`
        playlist.push({ videoId: id, title, thumbnail })
        socket.emit('GET_PLAYLIST', playlist)
      } else {
        socket.emit('FAIL', 'Playlist is full')
      }
    })
  });

}


socket({ io })


app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.resolve(__dirname, "../public", "index.html"))
})

server.listen(process.env.PORT, () => console.log(`Server listening on http://localhost:${process.env.PORT}`));