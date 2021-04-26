const sgMail = require('@sendgrid/mail')

const sendgridApiKey = process.env.SENDGRID_API_KEY;

sgMail.setApiKey(sendgridApiKey);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
      to: email,
      from: 'hogowov514@hype68.com',
      subject: 'Greetings.',
      text: `Welcome to the app ${name}, let me know how you get along with the app.`
  });
}

const sendCancellationEmail = (email, name) => {
  sgMail.send({
      to: email,
      from: 'hogowov514@hype68.com',
      subject: 'Your account has been succesfully cancelled.',
      text: `Your account has been succesfully cancelled ${name}, could you let us know why you cancelled? ty.`
  });
}

module.exports = {
  sendWelcomeEmail,
  sendCancellationEmail
}