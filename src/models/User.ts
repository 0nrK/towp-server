import { Schema, model, Document } from 'mongoose'

export interface UserInterface extends Document {
    username: string
    password: string
    isAdmin: boolean
}

const userSchema: Schema = new Schema<UserInterface>(
    {
        username: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        isAdmin: {
            type: Boolean,
            required: true,
            default: false,
        },
    },
    {
        timestamps: true,
    }
)


userSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.password
        delete ret.isAdmin
        return ret
    },
    virtuals: true
})

const User = model<UserInterface>('User', userSchema)

export default User


