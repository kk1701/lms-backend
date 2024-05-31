import nodemailer from 'nodemailer'

const sendEmail = async function(email, subject, message){
    let transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,  //true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USERNAME,
            pass: process.env.SMTP_PASSWORD
        }
    })

    await transporter.sendMail({
        from: process.env.SMTP_FROM_EMAIL, //sender's address
        to: email, //user email
        subject: subject,
        html: message // html body / message
    })
}

export default sendEmail