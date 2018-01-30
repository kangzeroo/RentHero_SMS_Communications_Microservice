const twilio_client = require('../twilio_setup').generate_twilio_client();
// const twiml_client = new require('../twilio_setup').generate_twiml_client()
const RENTHERO_SENDER_ID = require('../message_logs/schema/dynamodb_tablenames').RENTHERO_SENDER_ID
const uuid = require('uuid')
const shortid = require('shortid')
const MessagingResponse = require('twilio').twiml.MessagingResponse;

const VoiceResponse = require('twilio').twiml.VoiceResponse;

const gatherOutgoingNumber = require('../api/sms_routing').gatherOutgoingNumber

const formattedPhoneNumber = require('../api/general_api').formattedPhoneNumber

const get_landlords_twilio = require('./LeasingDB/Queries/SMSQueries').get_landlords_twilio


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
      if (outgoingPhoneNumber && outgoingPhoneNumber.length > 0) {
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
      } else {
        get_landlords_twilio(to)
        .then((landlordData) => {
          console.log(landlordData)
          const voiceResponse = new VoiceResponse()
          const tenants = landlordData.map(a => { return a.first_name + ' ' + a.last_name })
          console.log(tenants)
          const gather = voiceResponse.gather({
            input: 'speech dtmf',
            timeout: 3,
            numDigits: landlordData.length,

          })
          gather.say('Your number is not mapped. Please select your group leader')
          tenants.map((tenant, index) => {
            return (
              gather.say(`Press ${index + 1} for ${tenant}`)
            )
          })
        })
      }
    })
}


exports.voice_fallback = function(req, res, next) {
  const voiceResponse = new VoiceResponse()

  const gather = voiceResponse.gather({
    input: 'speech dtmf',
    timeout: 3,
    numDigits: 1,
  })
  gather.say('Please say the name of the property you are here to visit.')
}


exports.get_all_calls = function(req, res, next) {
  twilio_client.calls
  .list({ status: 'completed' })
  .then((data) => {
    const arrayOfPromises = data.map((call) => {
      return {
        from: call.from,
        to: call.to,
        dateCreated: call.dateCreated,
        dateUpdated: call.dateUpdated,
        direction: call.direction,
        duration: call.duration,
        startTime: call.startTime,
        endTime: call.endTime,
        phoneNumberSid: call.phoneNumberSid,
        sid: call.sid,
        status: call.status,
      }
    })

    Promise.all(arrayOfPromises)
    .then((callData) => {
      console.log(callData)
      res.json({
        calls: callData,
      })
    })
  })
  .catch((err) => {
    console.log(err)
    res.status(500).send('Failed to retrieve all calls')
  })
}

exports.get_calls_from = function(req, res, next) {
  const info = req.body
  twilio_client.calls
  .list({ from: info.from })
  .then((data) => {
    const arrayOfPromises = data.map((call) => {
      return {
        from: call.from,
        to: call.to,
        dateCreated: call.dateCreated,
        dateUpdated: call.dateUpdated,
        direction: call.direction,
        duration: call.duration,
        startTime: call.startTime,
        endTime: call.endTime,
        phoneNumberSid: call.phoneNumberSid,
        sid: call.sid,
        status: call.status,
      }
    })

    Promise.all(arrayOfPromises)
    .then((callData) => {
      res.json({
        calls: callData,
      })
    })
  })
  .catch((err) => {
    console.log(err)
    res.status(500).send('Failed to retrieve all calls')
  })
}

exports.get_calls_to = function(req, res, next) {
  const info = req.body
  twilio_client.calls
  .list({ to: info.to })
  .then((data) => {
    const arrayOfPromises = data.map((call) => {
      return {
        from: call.from,
        to: call.to,
        dateCreated: call.dateCreated,
        dateUpdated: call.dateUpdated,
        direction: call.direction,
        duration: call.duration,
        startTime: call.startTime,
        endTime: call.endTime,
        phoneNumberSid: call.phoneNumberSid,
        sid: call.sid,
        status: call.status,
      }
    })

    Promise.all(arrayOfPromises)
    .then((callData) => {
      res.json({
        calls: callData,
      })
    })
  })
  .catch((err) => {
    console.log(err)
    res.status(500).send('Failed to retrieve all calls')
  })
}

exports.get_calls_from_to = function(req, res, next) {
  const info = req.body
  twilio_client.calls
  .list({ from: info.from, to: info.to })
  .then((data) => {
    const arrayOfPromises = data.map((call) => {
      return {
        from: call.from,
        to: call.to,
        dateCreated: call.dateCreated,
        dateUpdated: call.dateUpdated,
        direction: call.direction,
        duration: call.duration,
        startTime: call.startTime,
        endTime: call.endTime,
        phoneNumberSid: call.phoneNumberSid,
        sid: call.sid,
        status: call.status,
      }
    })

    Promise.all(arrayOfPromises)
    .then((callData) => {
      res.json({
        calls: callData,
      })
    })
  })
  .catch((err) => {
    console.log(err)
    res.status(500).send('Failed to retrieve all calls')
  })
}

exports.get_recordings_for_given_call = function(req, res, next) {
  const info = req.body
  twilio_client.api.calls(info.call_id).recordings.list()
  .then((data) => {
    const arrayOfPromises = data.map((recording) => {
      return {
        callSid: recording.callSid,
        sid: recording.sid,
        dateCreated: recording.dateCreated,
        dateUpdated: recording.dateUpdated,
        price: recording.price,
        uri: recording.uri,
        duration: recording.duration,
      }
    })

    Promise.all(arrayOfPromises)
    .then((recordingData) => {
      console.log(recordingData)
      res.json({
        recordings: recordingData,
      })
    })
  })
  .catch((err) => {
    console.log(err)
    res.status(500).send('Failed to get recordings for call')
  })
}
