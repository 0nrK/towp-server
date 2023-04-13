// write a function that gets the video id from the url
// and returns the video id

// write a function that gets the video id from the url 
// and returns the video id
//example: https://www.youtube.com/watch?v=QH2-TGUlwu4
function getVideoId(url: string): string {
    const urlParts = url.split('/');
    const videoId = urlParts[urlParts.length - 1];
    return videoId;
}
