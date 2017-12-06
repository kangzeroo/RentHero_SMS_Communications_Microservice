const generate_twilio_client = require('../twilio_setup').generate_twilio_client
const twilio = require('twilio')
const MessagingResponse = twilio.twiml.MessagingResponse
const twilio_client = generate_twilio_client()


// POST /initial
exports.initial = function(req, res, next) {
  console.log(req.body)
  console.log('Initial message')
  twilio_client.messages.create({
    body: 'Initial Message Sent',
    to: '+15195726998',
    // to: '+15195726998',
    messagingServiceSid: 'MG7b2fbcc0003b6a821cc6e8f862e6b6e6' // From a valid Twilio number
  }).then((message) => {
    console.log('MESSAGE SENT')
    console.log(message)
  }).catch((err) => {
    console.log('ERROR OCCURRED')
    console.log(err)
  })
  res.status(200).send()
}


// POST /sms
exports.sms = function(req, res, next) {
console.log(req.body)

const from = req.body.From
const to   = req.body.To
const body = req.body.Body

 gatherOutgoingNumber(from)
  .then(function (outgoingPhoneNumber) {
    var messagingResponse = new MessagingResponse();
    messagingResponse.message({ to: outgoingPhoneNumber }, body)

   res.type('text/xml');
   res.send(messagingResponse.toString());
  })
}


const gatherOutgoingNumber = (incomingPhoneNumber) => {
//  const phoneNumber = anonymousPhoneNumber
  const p = new Promise((res, rej) => {

   const hostPhoneNumber = '+15195726998'
   const guestPhoneNumber = '+16475286355'

   let outgoingPhoneNumber

   if (guestPhoneNumber === incomingPhoneNumber) {
      outgoingPhoneNumber = hostPhoneNumber
    }

   if (hostPhoneNumber === incomingPhoneNumber) {
      outgoingPhoneNumber = guestPhoneNumber
    }
    res(outgoingPhoneNumber)
  })
  return p
}
