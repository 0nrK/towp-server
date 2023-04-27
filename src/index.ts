import express, { Request, Response } from "express";
import dotenv from 'dotenv'
import cors from 'cors'
import http from 'http';
import { Server } from "socket.io";
import getVideoId from 'get-video-id';
import loaders from "./config/db";
import session from 'express-session'
import { durationFormater, getVideoDuration, getYTVideoInfo } from "./utils/yt";
import authRoute from './routes/authRoute'
import bodyParser from "body-parser";
import { IVideo } from "./types/Video";
import path from "path";
import User from "./models/User";
import { IMessage } from "./types/message";
import jwt from "jsonwebtoken";
import { promisify } from "./utils/promisify";

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


const current: any = {
  _duration: 0,
  _video: playlist[0],
  _videoTimer: 0,
  set duration(value: number) {
    this._duration = value
  },
  set video(value: IVideo) {
    this._video = value
    setInterval(() => setCurrentVideo(), this?._video?.duration * 1000)
  },
  set videoTimer(value: number) {
    this._videoTimer = value
  },
  get videoTimer() {
    return this._videoTimer
  },
  get duration() {
    return this._duration
  },
  get video() {
    return this._video
  }
}



function setCurrentVideo() {
  console.log(current._video)
  playlist.shift()
  current.video = playlist[0]
}

const io = new Server(server, {
  cors: {
    credentials: true,
    origin: '*'
  },
});
process.on('warning', e => console.warn(e.stack))
function socket({ io }: { io: Server }) {
  console.log(`Sockets enabled`);

  io.on('connection', (socket: any) => {

    socket.on('SYNK_VIDEO', (second: number) => {
      current.videoTimer = second + 3
    })
    socket.emit('GET_VIDEO', { video: current.video, videoTimer: current.videoTimer })


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
          setCurrentVideo()
          socket.emit('CURRENT_VIDEO', current._video)
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
      socket.emit('CURRENT_VIDEO', { video: current._video })
    }, 3000)

    setInterval(() => {
      socket.emit('GET_MESSAGES', messageList)
    }, 1000)

    setInterval(() => {
      socket.emit('GET_PLAYLIST', playlist)
    }, 2000)
    socket.on('VIDEO_END', async () => {
      socket.emit('CURRENT_VIDEO', { video: current.video })
    })
    socket.on('ADD_TO_PLAYLIST', async (data: any) => {
      if (playlist.length < 20) {
        const { id }: any = getVideoId(data)
        const { title } = await getYTVideoInfo({ videoId: id, part: 'snippet' })
        const { duration } = await getVideoDuration(id)
        const formatedDuration = durationFormater(duration)
        const thumbnail = `https://img.ytimg.com/vi/${id}/default.jpg`
        playlist.push({ videoId: id, title, thumbnail, duration: formatedDuration })
        if (!current._video) {
          current.video = playlist[0]
        }
        socket.emit('SUCCESS')
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