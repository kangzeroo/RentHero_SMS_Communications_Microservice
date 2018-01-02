const twilio_client = require('../twilio_setup').generate_twilio_client();
const notifyServicesSid = process.env.NOTIFY_SERVICE_ID
const formattedPhoneNumber = require('../api/general_api').formattedPhoneNumber
const shortid = require('shortid')

const insertCommunicationsLog = require('../message_logs/dynamodb_api').insertCommunicationsLog


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
    info.phones.forEach((phone) => {
      insertCommunicationsLog({
        'ACTION': 'SMS_MESSAGE',
        'DATE': new Date().getTime(),
        'COMMUNICATION_ID': shortid.generate(),

        'SENDER_CONTACT_ID': 'RentHeroSMS',
        'RECEIVER_CONTACT_ID': phone,
        'PROXY_CONTACT_ID': 'RentHeroSMS',
        'TEXT': message,
      })
    })
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

exports.receive_message_from_phone = function(req, res, next) {
  const info = req.body
  console.log(info)

  insertCommunicationsLog({
    'ACTION': 'SMS_MESSAGE',
    'DATE': new Date().getTime(),
    'COMMUNICATION_ID': shortid.generate(),

    'SENDER_CONTACT_ID': info.From,
    'RECEIVER_CONTACT_ID': 'RentHeroSMS',
    'PROXY_CONTACT_ID': info.To,
    'TEXT': info.From,
  })
}

// SmsSid=SM8884665161e8ab18b988fd4e7f3945d3
// &SmsStatus=sent
// &MessageStatus=sent
// &To=%2B16475286355
// &MessagingServiceSid=MG4f645b25e4396614a92e6377ba73aff2
// &MessageSid=SM8884665161e8ab18b988fd4e7f3945d3
// &AccountSid=AC3cfc4b5a78368f2cdb70baf2c945aee7
// &From=%2B12892746748
// &ApiVersion=2010-04-01
//
// ToCountry=CA
// &ToState=ON
// &SmsMessageSid=SMbf505253cd06a3991e7274ba563dcf6e
// &NumMedia=0
// &ToCity=OSHAWA
// &FromZip=
// &SmsSid=SMbf505253cd06a3991e7274ba563dcf6e
// &FromState=ON
// &SmsStatus=received
// &FromCity=Toronto
// &Body=Shsjsjskksk
// &FromCountry=CA
// &To=%2B12892746748
// &MessagingServiceSid=MG4f645b25e4396614a92e6377ba73aff2
// &ToZip=
// &AddOns=%7B%22status%22%3A%22successful%22%2C%22message%22%3Anull%2C%22code%22%3Anull%2C%22results%22%3A%7B%22ibm_watson_sentiment%22%3A%7B%22request_sid%22%3A%22XR57eb9566574b2a88396ed8be632a07bf%22%2C%22status%22%3A%22successful%22%2C%22message%22%3Anull%2C%22code%22%3Anull%2C%22result%22%3A%7B%22status%22%3A%22OK%22%2C%22language%22%3A%22english%22%2C%22docSentiment%22%3A%7B%22type%22%3A%22neutral%22%7D%7D%7D%7D%7D
// &NumSegments=1
// &MessageSid=SMbf505253cd06a3991e7274ba563dcf6e
// &AccountSid=AC3cfc4b5a78368f2cdb70baf2c945aee7
// &From=%2B16475286355
// &ApiVersion=2010-04-01
