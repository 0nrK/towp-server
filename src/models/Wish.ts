import mongoose from 'mongoose'

interface IWish extends mongoose.Document {
    videos: string[]
    createdBy: string
}

const WishSchema = new mongoose.Schema({
    videoId: {
        type: [String],
        required: true,
    },
    createdBy:{
        type: String,
        required: true
    }
})

const Wish = mongoose.model<IWish>('Wish', WishSchema)
export default Wish