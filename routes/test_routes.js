const generate_twilio_client = require('../twilio_setup').generate_twilio_client
const twilio = require('twilio')
const MessagingResponse = twilio.twiml.MessagingResponse
const gatherOutgoingNumber = require('../api/sms_routing')

// GET /test
exports.test = function(req, res, next){
  res.json({
    message: "Test says alive and well"
  })
}

// POST /send_message
exports.send_message = function(req, res, next) {
  console.log(req.body)
  const twilio_client = generate_twilio_client()
  twilio_client.messages.create({
    body: 'Wagwam fam, we the RentHero squad',
    // to: '+15195726998',  // Text this number
    to: '+15195726998',
    from: '+12268870232 ' // From a valid Twilio number
  }).then((message) => {
    console.log(message.sid)
  })
}

exports.receive_message = function(req, res, next) {
  const MessagingResponse = require('twilio').twiml.MessagingResponse

  const response = new MessagingResponse()
  const message = response.message()
  message.body('Hello World!')
  response.redirect('https://demo.twilio.com/sms/welcome')

  console.log(response.toString())
} 

// POST /outbound
exports.outbound = function(req, res, next) {
  console.log(req.body)
  console.log('OUTBOUND')
  const twiml = new MessagingResponse()
  twiml.message('Awww yea SLAM DUNK');

  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
}

// POST /use-sms
exports.sms = function(req, res, next) {
console.log(req.body)

const from = req.body.From;
const to   = req.body.To;
const body = req.body.Body;

 gatherOutgoingNumber(from)
  .then(function (outgoingPhoneNumber) {
    var messagingResponse = new MessagingResponse();
    messagingResponse.message({ to: outgoingPhoneNumber }, body);

   res.type('text/xml');
   res.send(messagingResponse.toString());
  })
}
