export interface IVideo {
    videoId: string
    title: string
    thumbnail: string
    createdBy?: string
}

export interface ICurrentVideo {
    videoId: string,
    duration: number
}