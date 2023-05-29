import axios from 'axios'

export async function getYTVideoInfo({ videoId, part = 'snippet' }: { videoId: string, part: string }) {
    try {
        const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos?part=${part}&id=${videoId}&key=${process.env.YT_API_KEY}`)
        const data = response.data
        if (!data) throw new Error('Video not found')
        const videoData = data.items[0][part]
        return videoData
    } catch (err) {
        console.log(err)
    }
}

export async function getVideoDuration(videoId: string) {
    try {
        const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${process.env.YT_API_KEY}`)
        const data = response.data
        if (!data) throw new Error('Video not found')
        const videoData = data.items[0].contentDetails
        return videoData
    } catch (err) {
        console.log(err)
    }
}

export function durationFormater(data: string): number {
    let a = data.match(/\d+/g)
    let duration = 0

    if (a!.length == 3) {
        duration = duration + parseInt(a![0]) * 3600;
        duration = duration + parseInt(a![1]) * 60;
        duration = duration + parseInt(a![2]);
    }

    if (a!.length == 2) {
        duration = duration + parseInt(a![0]) * 60;
        duration = duration + parseInt(a![1]);
    }

    if (a!.length == 1) {
        duration = duration + parseInt(a![0]);
    }
    return duration
}