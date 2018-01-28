const twilio_client = require('../twilio_setup').generate_twilio_client();
// const twiml_client = new require('../twilio_setup').generate_twiml_client()
const RENTHERO_SENDER_ID = require('../message_logs/schema/dynamodb_tablenames').RENTHERO_SENDER_ID
const uuid = require('uuid')
const shortid = require('shortid')
const MessagingResponse = require('twilio').twiml.MessagingResponse;

const VoiceResponse = require('twilio').twiml.VoiceResponse;

const gatherOutgoingNumber = require('../api/sms_routing').gatherOutgoingNumber

const formattedPhoneNumber = require('../api/general_api').formattedPhoneNumber


exports.voice = function(req, res, next) {
  console.log('/voice')

  // const addons = json.loads(request.values['AddOns'])
  // const speechtotext = addons['results']['ibm_watson_speechtotext']
  //
  // console.log(speechtotext)

  let from = req.body.From
  let to   = req.body.To
  let body = req.body.Body

   gatherOutgoingNumber(from, to)
    .then((outgoingPhoneNumber) => {
      console.log(outgoingPhoneNumber)
       const voiceResponse = new VoiceResponse()
       voiceResponse.say({
         voice: 'alice',
         language: 'en',
       },
        'this call may be recorded for quality and training purposes'
       )
       const dial = voiceResponse.dial({ callerId: to, record: 'record-from-answer' })
       dial.number(outgoingPhoneNumber)


       console.log(dial)
       console.log(voiceResponse.toString())
       res.type('text/xml')
       res.send(voiceResponse.toString())
    })
}


exports.get_all_calls = function(req, res, next) {
  console.log(twilio_client.calls)
  res.send(twilio_client.calls)
}

exports.get_all_recordings = function(req, res, next) {
  twilio_client.recordings.each(recording => console.log(recording))
  res.send(twilio_client.recordings)
}


exports.get_recordings_for_given_call = function(req, res, next) {
  const info = req.body
  twilio_client.api.calls(info.call_id).recordings.list()
}
