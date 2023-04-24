import express, { Request, Response } from 'express'
import User from '../models/User'
import bcrypt from 'bcryptjs'
import generateToken from '../utils/generateJwt'

const router = express.Router()

router.post('/register', async (req: Request, res: Response) => {
    console.log(req.body.username, req.body.password)
    try {
        const { username, password } = req.body
        // hash password with bcrypt
        const isUserExists = await User.findOne({ username })
        if (isUserExists) return res.status(400).send('User already exists')
        const hashedPw = await bcrypt.hash(password, 10)
        const user = await new User({ username, password: hashedPw })
        await user.save()
        const token = generateToken(user?._id as string)
        return res.status(200).send({ user, token })
    } catch (err) {
        res.status(400).send({ message: 'Failed' })
    }
})

router.post('/login', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body
        const user = await User.findOne({ username })
        // compare user.password with password 
        if (user) {
            const isPasswordCorrect = await bcrypt.compare(password, user?.password as string)
            if (isPasswordCorrect) {
                const token = generateToken(user?._id as string)
                return res.status(200).send({ user, token })
            }
        }
        res.status(400).send({ message: 'Failed' })
    } catch (err) {
        res.status(400).send(err)
    }
});

export default router