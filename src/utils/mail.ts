import nodemailer from 'nodemailer'
const sendMail = async (to: string) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.TOWP_EMAIL as string,
            pass: process.env.TOWP_EMAIL_PASSWORD as string
        }
    });
    const mailOptions = {
        from: 'ToWP',
        to: to,
        subject: 'E-mail verification',
        html: `<h1>Click <a href="https://towp-server-0nrk.onrender.com/api/auth/verify/${to}">here</a> to verify your e-mail</h1>`
    };
    await transporter.sendMail(mailOptions);
};
export default sendMail