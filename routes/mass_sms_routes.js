const twilio_client = require('../twilio_setup').generate_twilio_client();
const notifyServicesSid = process.env.NOTIFY_SERVICE_ID
const formattedPhoneNumber = require('../api/general_api').formattedPhoneNumber

exports.send_message_to_phones = function(req, res, next) {
  const info = req.body
  const message = info.body


  const toBind = info.phones.map((phone) => {
    return JSON.stringify({ binding_type: 'sms', address: formattedPhoneNumber(phone), })
  })

  twilio_client.notify.services(notifyServicesSid).notifications.create({
    toBinding: toBind,
    body: message,
  })
  .then((notification) => {
    res.json({
      message: 'SMS sent',
      notification_id: notification.id,
    })
  })
  .catch(error => {
    console.log(error)
    res.status(500).send('Error occurred sending SMS notification')
  })

}

// console.log('Send group invitation sms')
// const info = req.body
//
// const body = info.body
//
// const arrayOfPromises = info.phones.forEach((phone) => {
//   twilio_client.messages.create({
//     body: body,
//     to: phone,
//     messagingServiceSid: messagingServiceSid,
//   })
//   .then((message) => {
//     console.log(message)
//   })
// })
//
// Promise.all(arrayOfPromises)
// .then((data) => {
//   res.json({
//     message: 'sent'
//   })
// })
// .catch((err) => {
//   console.log(err)
// })
