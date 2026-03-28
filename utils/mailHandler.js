const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 25,
  secure: false, // Use true for port 465, false for port 587
  auth: {
    user: "598fbff0574bd6",
    pass: "f2f17f540834a9",
  },
});

module.exports = {
  sendMail: async (to, url) => {
    const info = await transporter.sendMail({
      from: "admin@haha.com",
      to: to,
      subject: "RESET PASSWORD REQUEST",
      text: "lick vo day de doi pass", // Plain-text version of the message
      html: "lick vo <a href=" + url + ">day</a> de doi pass", // HTML version of the message
    });

    console.log("Message sent:", info.messageId);
  },
  sendWelcomeMail: async (to, username, password) => {
    const info = await transporter.sendMail({
      from: "admin@haha.com",
      to: to,
      subject: "Welcome to Our Platform",
      text: `Welcome ${username}! Your password is: ${password}`,
      html: `<h2>Welcome ${username}!</h2><p>Your account has been created.</p><p>Username: <strong>${username}</strong></p><p>Password: <strong>${password}</strong></p>`,
    });

    console.log("Welcome email sent:", info.messageId);
  },
};
