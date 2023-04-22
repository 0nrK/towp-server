import mongoose from 'mongoose'

export const db = mongoose.connection

db.once('open', () => {
    console.log('Database connection was successfully.')
})

const loaders = async () => {
    mongoose.set('strictQuery', false)
    await mongoose.connect(process.env.MONGODB_URI as string)
}

export default loaders