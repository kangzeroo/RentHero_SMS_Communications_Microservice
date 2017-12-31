const twilio_client = require('../twilio_setup').generate_twilio_client();
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const messagingServiceSid = 'MG4f645b25e4396614a92e6377ba73aff2'


exports.send_message_to_phones = function(req, res, next) {
  console.log('Send group invitation sms')
  const info = req.body

  const body = info.body

  const arrayOfPromises = info.phones.forEach((phone) => {
    twilio_client.messages.create({
      body: body,
      to: phone,
      messagingServiceSid: messagingServiceSid,
    })
    .then((message) => {
      console.log(message)
    })
  })

  Promise.all(arrayOfPromises)
  .then((data) => {
    res.json({
      message: 'sent'
    })
  })
  .catch((err) => {
    console.log(err)
  })
}
