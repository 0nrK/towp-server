export interface IVideo {
    videoId: string
    title: string
    thumbnail: string
    createdBy?: string
    duration: number
}

export interface ICurrentVideo {
    videoId: string,
    duration: number
}