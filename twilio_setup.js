const twilio = require('twilio')
const twilio_config = require('./credentials/twilio_credentials')

exports.generate_twilio_client = function() {
  return new twilio(twilio_config.TWILIO_accountSid, twilio_config.TWILIO_authToken)
}

exports.generate_twiml_client = function() {
  return require('twilio').twiml.MessagingResponse
}
