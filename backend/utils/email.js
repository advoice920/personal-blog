const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465, // SSL port
  secure: true, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // This might need to be an auth code
  },
});

exports.sendVerificationCode = async (toEmail, code, subject) => {
  subject = subject || '【LiveBlog】您的注册验证码';
  const isReset = subject.includes('重置');
  const title = isReset ? 'LiveBlog 密码重置' : '欢迎注册 LiveBlog';
  const body = isReset
    ? `您正在重置 LiveBlog 账户的密码。<br/>`
    : `欢迎注册 LiveBlog<br/>`;
  try {
    const info = await transporter.sendMail({
      from: `"LiveBlog" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject,
      html: `
        <div style="padding: 20px; background-color: #f9f9f9; font-family: sans-serif;">
          <h2 style="color: #333;">${title}</h2>
          <p>${body}您的验证码是：<strong style="font-size: 24px; color: #fc3c44;">${code}</strong></p>
          <p>请在 5 分钟内完成验证。如果不是您本人的操作，请忽略此邮件。</p>
        </div>
      `,
    });
    console.log("Message sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};
