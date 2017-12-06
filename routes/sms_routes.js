const generate_twilio_client = require('../twilio_setup').generate_twilio_client
const twilio = require('twilio')
const MessagingResponse = twilio.twiml.MessagingResponse
const twilio_client = generate_twilio_client()
const gatherOutgoingNumber = require('../api/sms_routing').gatherOutgoingNumber
const insertSMSLog = require('../message_logs/dynamodb_api').insertSMSLog

// POST /initial
exports.initial = function(req, res, next) {
  console.log('---------------- Initial message ----------------')
  console.log(req.body)
  twilio_client.messages.create({
    body: 'Initial Message Sent',
    to: '+15195726998',
    // to: '+15195726998',
    messagingServiceSid: 'MG7b2fbcc0003b6a821cc6e8f862e6b6e6' // From a valid Twilio number
  }).then((message) => {
    console.log('MESSAGE SENT')
    console.log(message)
    insertSMSLog(req.body)
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
    messagingResponse.message({
      to: outgoingPhoneNumber,
      statusCallback: () => {
        console.log('statusCallback')
        insertSMSLog(req.body)
      }
    }, body)

   res.type('text/xml');
   res.send(messagingResponse.toString());
  })
}
