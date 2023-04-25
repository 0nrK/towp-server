import express, { NextFunction, Request, Response } from "express";
import dotenv from 'dotenv'
import cors from 'cors'
import http from 'http';
import { Server } from "socket.io";
import getVideoId from 'get-video-id';
import loaders from "./config/db";
import session from 'express-session'
import { durationFormater, getYTVideoInfo } from "./utils/yt";
import authRoute from './routes/authRoute'
import bodyParser from "body-parser";
import { ICurrentVideo, IVideo } from "./types/Video";
import helmet from 'helmet'
import path from "path";
import User from "./models/User";
import { IMessage } from "./types/message";
import jwt from "jsonwebtoken";

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));

dotenv.config()

app.use(bodyParser.json())
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

app.use('/api/auth', authRoute)

loaders()



const sockets: string[] = []
const playlist: IVideo[] = []
const messageList: IMessage[] = []
const server = http.createServer(app);
let videoDuration: [number] = [30]
let currentVideo: any = null

setTimeout(async () => {
  console.log('asad')
  playlist.shift()
  currentVideo = playlist[0]
  console.log(videoDuration)
}, videoDuration[0] * 1000)

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

    socket.on('SEND_MESSAGE', async (data: any) => {
      const decodedToken = jwt.verify(data.token, process.env.JWT_SECRET as string) as any
      const user = await User.findById({ _id: decodedToken.id })

      if (user!.isAdmin) {
        const text = data.message.split(' ')
        if (text.includes('/next')) {
          playlist.shift()
          currentVideo = playlist[0]
          socket.emit('START_VIDEO', currentVideo)
        }
      }
      const message: IMessage = {
        user: user?.username as any,
        message: data.message
      }
      messageList.push(message)
      socket.emit('GET_MESSAGES', messageList)
    })

    setInterval(() => {
      socket.emit('CURRENT_VIDEO', currentVideo)
    }, 3000)

    setInterval(() => {
      socket.emit('GET_MESSAGES', messageList)
    }, 1000)

    setInterval(() => {
      socket.emit('GET_PLAYLIST', playlist)
    }, 2000)
    socket.on('START_VIDEO', (data: any) => {
      socket.emit('CURRENT_VIDEO', currentVideo)
    })
    socket.on('ADD_TO_PLAYLIST', async (data: any) => {
      if (playlist.length < 20) {
        const { id }: any = getVideoId(data)
        const { title } = await getYTVideoInfo({ videoId: id, part: 'snippet' })
        const thumbnail = `https://img.ytimg.com/vi/${id}/default.jpg`
        playlist.push({ videoId: id, title, thumbnail })
        if (!currentVideo) currentVideo = playlist[0]
        if (currentVideo) {
          const { duration } = await getYTVideoInfo({
            videoId: currentVideo?.videoId,
            part: 'contentDetails'
          })
          videoDuration[0] = durationFormater(duration)
        }
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