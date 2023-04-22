import axios from 'axios'

export default async function getYTVideoInfo(videoId: string) {
    try {
        const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.YT_API_KEY}`)
        const data = response.data
        const videoData  = data.items[0].snippet
        return videoData
    } catch (err) {
        console.log(err)
    }
}