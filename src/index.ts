import express, { NextFunction, Request, Response } from "express";
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

app.use((req: Request, res: Response, next: NextFunction) => {
  const error: any = new Error("Not Found")
  error.status = 404;
  next(error)
})

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  if (error.status) {
    return res.status(error.status).json({
      message: error.message,
    })
  }

  res.status(500).json({ message: 'something went wrong' })
})

const sockets: string[] = []
const playlist: IVideo[] = []
const messageList: IMessage[] = []
const server = http.createServer(app);


const current: any = {
  _duration: 0,
  _video: playlist[0],
  _videoTimer: 0,
  _startedPlayingAt: Date.now() / 1000,
  set duration(value: number) {
    this._duration = value
  },
  set video(value: IVideo) {
    this._videoTimer = 0
    this._video = value
    this._startedPlayingAt = Date.now() / 1000
    if (this?._video?.duration) {
      this._durationTimeout = setTimeout(() => {
        setCurrentVideo()
      }, this._video.duration * 1000)
    }
  },
  set videoTimer(value: number) {
    this._videoTimer = value
  },
  get videoTimer() {
    const currentSecond = Date.now() / 1000 - this?._startedPlayingAt
    return Math.round(currentSecond)
  },
  get duration() {
    return this._duration
  },
  get video() {
    return this._video
  }
}



function setCurrentVideo() {
  playlist.shift()
  current._startedPlayingAt = Date.now() / 1000
  clearTimeout(current._durationTimeout)
  if (!playlist[0]) {
    current.video = null
    current.videoTimer = 0
    return;
  }
  current.video = playlist[0]
}

const io = new Server(server, {
  cors: {
    credentials: true,
    origin: '*'
  },
});
process.on('warning', e => console.warn('warning:', e.stack))
function socket({ io }: { io: Server }) {
  console.log(`Sockets enabled`);

  io.on('connection', (socket: any) => {
    socket.emit('GET_VIDEO', {
      video: current.video,
      videoTimer: current.videoTimer
    })

    socket.emit('GET_PLAYLIST', playlist)
    socket.emit('GET_MESSAGES', messageList)

    socket.on('VIDEO_ENDS', () => {
      socket.emit('GET_VIDEO', {
        video: current.video,
        videoTimer: current.videoTimer
      })
      socket.emit('GET_PLAYLIST', playlist)
    })

    setInterval(() => {
      socket.emit('CURRENT_VIDEO', {
        video: current.video,
      })
    }, 3000)


    console.log(`User connected ${socket.id}`);
    sockets.push(socket.id)
    socket.on('disconnect', (socket: any) => {
      console.log(`User disconnected ${socket.id}`);
      sockets.splice(sockets.indexOf(socket.id), 1)
    })

    socket.on('SEND_MESSAGE', async (data: any) => {
      const decodedToken = jwt.verify(data.token, process.env.JWT_SECRET as string) as any
      const user = await User.findById({ _id: decodedToken.id })
      if (user!.isBanned) {
        socket.emit('USER_BANNED', 'You are banned')
        return;
      }
      if (user!.isAdmin) {
        const text = data.message.split(' ')
        if (text.includes('/next')) {
          setCurrentVideo()
          io.sockets.emit('GET_VIDEO', {
            video: current.video,
            videoTimer: current.videoTimer
          })
          io.sockets.emit('GET_PLAYLIST', playlist)
        }
        if (text.includes('/ban')) {
          const user = text[text.indexOf('/ban') + 1]
          const userFromDb = await User.findOne({ username: user })
          if (userFromDb) {
            userFromDb.isBanned = true
            await userFromDb.save()
          }
        }
        if (text.includes('/unban')) {
          const user = text[text.indexOf('/unban') + 1]
          const userFromDb = await User.findOne({ username: user })
          if (userFromDb) {
            userFromDb.isBanned = false
            await userFromDb.save()
          }
        }
      }
      const message: IMessage = {
        user: user!.username as string,
        message: data.message
      }
      messageList.push(message)
      io.sockets.emit('GET_MESSAGES', messageList)
    })

    socket.on('ADD_TO_PLAYLIST', async (data: any) => {
      if (playlist.length < 20) {
        const decodedToken = jwt.verify(data.token, process.env.JWT_SECRET as string) as any
        const user = await User.findById({ _id: decodedToken.id })
        if (user!.isBanned) {
          socket.emit('USER_BANNED', 'You are banned')
          return;
        }
        const { id }: any = getVideoId(data.id)
        const { title } = await getYTVideoInfo({ videoId: id, part: 'snippet' })
        const { duration } = await getVideoDuration(id)
        if (!title || !duration || !id) {
          throw new Error('Error geting video duration')
        }
        const formatedDuration = durationFormater(duration)
        const thumbnail = `https://img.ytimg.com/vi/${id}/default.jpg`
        playlist.push({
          videoId: id,
          title,
          thumbnail,
          duration: formatedDuration,
          createdBy: user?.username
        })
        if (!current.video) {
          current.video = playlist[0]
          io.sockets.emit('GET_VIDEO', {
            video: current.video,
            videoTimer: current.videoTimer
          })
        }
        socket.emit('SUCCESS', 'Video added to playlist')
        io.sockets.emit('GET_PLAYLIST', playlist)
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