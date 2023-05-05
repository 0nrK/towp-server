import { Schema, model, Document } from 'mongoose'

export interface UserInterface extends Document {
    username: string
    password: string
    isAdmin: boolean
    isBanned: boolean
    email: string
    isEmailVerified: boolean
    verificationString: string
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
        isEmailVerified: {
            type: Boolean,
            required: true,
        },
        isBanned: {
            type: Boolean,
            default: false
        },
        email: {
            type: String,
            required: true,
        },
        verificationString:{
            type: String,
        }
    },
    {
        timestamps: true,
    }
)

userSchema.pre('save', async function () {
    if (this.isNew) {
        const verificationString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        this.verificationString = verificationString
      }
})


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


