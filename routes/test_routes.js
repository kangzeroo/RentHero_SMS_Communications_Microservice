const generate_twilio_client = require('../twilio_setup').generate_twilio_client

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
