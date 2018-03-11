const twilio_client = require('../twilio_setup').generate_twilio_client();
// const twiml_client = new require('../twilio_setup').generate_twiml_client()
const RENTHERO_SENDER_ID = require('../message_logs/schema/dynamodb_tablenames').RENTHERO_SENDER_ID
const uuid = require('uuid')
const shortid = require('shortid')
const MessagingResponse = require('twilio').twiml.MessagingResponse;

const VoiceResponse = require('twilio').twiml.VoiceResponse;

const gatherOutgoingNumber = require('../api/sms_routing').gatherOutgoingNumber
const gatherOutgoingNumberWithObject = require('../api/sms_routing').gatherOutgoingNumberWithObject

const get_landlords_twilio = require('./LeasingDB/Queries/SMSQueries').get_landlords_twilio
const insertCommunicationsLog = require('../message_logs/dynamodb_api').insertCommunicationsLog
const get_sms_match = require('./LeasingDB/Queries/SMSQueries').get_sms_match

const TWILIO_accountSid = process.env.TWILIO_accountSid

exports.voice = function(req, res, next) {
  console.log('/voice')

  let from = req.body.From
  let to   = req.body.To
  let body = req.body.Body

   gatherOutgoingNumberWithObject(from, to)
    .then((outgoingObject) => {
      console.log(outgoingObject)
      if (outgoingObject.outgoingPhoneNumber && outgoingObject.outgoingPhoneNumber.length > 0) {
        if (outgoingObject.outgoingPhoneNumber === outgoingObject.landlordPhoneNumber ) {
          insertCommunicationsLog({
            'ACTION': 'FORWARDED_CALL',
            'DATE': new Date().getTime(),
            'COMMUNICATION_ID': shortid.generate(),
            'MEDIUM': 'PHONE',

            'SENDER_ID': outgoingObject.tenantId,
            'SENDER_CONTACT_ID': outgoingObject.tenantPhoneNumber,
            'RECEIVER_CONTACT_ID': outgoingObject.landlordPhoneNumber,
            'RECEIVER_ID': outgoingObject.landlordId,
            'PROXY_CONTACT_ID': to,
            'TEXT': 'tenant called landlord',
          })
        } else if (outgoingObject.outgoingPhoneNumber === outgoingObject.tenantPhoneNumber ) {
          insertCommunicationsLog({
            'ACTION': 'FORWARDED_CALL',
            'DATE': new Date().getTime(),
            'COMMUNICATION_ID': shortid.generate(),
            'MEDIUM': 'PHONE',

            'SENDER_ID': outgoingObject.landlordId,
            'SENDER_CONTACT_ID': outgoingObject.landlordPhoneNumber,
            'RECEIVER_CONTACT_ID': outgoingObject.tenantPhoneNumber,
            'RECEIVER_ID': outgoingObject.tenantId,
            'PROXY_CONTACT_ID': to,
            'TEXT': 'landlord called tenant',
          })
        }

        const voiceResponse = new VoiceResponse()
        voiceResponse.say({
          voice: 'man',
          language: 'en',
        },
         'this call may be recorded for quality and training purposes'
        )

        const dial = voiceResponse.dial({ callerId: to, record: 'record-from-answer' })
        dial.number(outgoingObject.outgoingPhoneNumber)

        console.log(dial)
        console.log(voiceResponse.toString())

        res.type('text/xml')
        res.send(voiceResponse.toString())
      } else {
        console.log('FALLBACK')
        const voiceResponse = new VoiceResponse()
        const message_id = shortid.generate()
        const message = `Hello, please respond to this message with a property name, and we will connect you with the landlord. Cheers! [ RENTHERO TERMS OF USE: RentHero.cc/m/${message_id} ]`

        voiceResponse.say({
          voice: 'man',
          language: 'en',
        }, 'You are calling from an unrecognized number. Please send a text message of the property name')

        insertCommunicationsLog({
          'ACTION': 'RENTHERO_CALL_FALLBACK',
          'DATE': new Date().getTime(),
          'COMMUNICATION_ID': shortid.generate(),
          'MEDIUM': 'PHONE',

          'SENDER_ID': 'RENTHERO_CALL_FALLBACK',
          'SENDER_CONTACT_ID': 'RENTHERO_CALL_FALLBACK',
          'RECEIVER_CONTACT_ID': from,
          'RECEIVER_ID': from,
          'PROXY_CONTACT_ID': to,
          'TEXT': 'You are calling from an unrecognized number. Please send a text message of the property name',
        })

        twilio_client.messages.create({
          to: from,
          from: to,
          body: message,
        })

        insertCommunicationsLog({
          'ACTION': 'RENTHERO_CALL_FALLBACK_MESSAGE',
          'DATE': new Date().getTime(),
          'COMMUNICATION_ID': message_id,
          'MEDIUM': 'SMS',

          'SENDER_ID': 'RENTHERO_CALL_FALLBACK_MESSAGE',
          'SENDER_CONTACT_ID': 'RENTHERO_CALL_FALLBACK_MESSAGE',
          'RECEIVER_CONTACT_ID': from,
          'RECEIVER_ID': from,
          'PROXY_CONTACT_ID': to,
          'TEXT': message,
        })

        voiceResponse.hangup()
        res.type('text/xml')
        res.send(voiceResponse.toString())
      }
    })
}


exports.voice_fallback = function(req, res, next) {
  const voiceResponse = new VoiceResponse()
  voiceResponse.say({
    voice: 'man',
    language: 'en',
  }, 'You are calling from an unrecognized number. Please send a message to this number of the property name')
  voiceResponse.hangup()
  res.type('text/xml')
  res.send(voiceResponse.toString())
}

exports.voice_status_changes = function(req, res, next) {
  console.log(req.body)
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
  console.log(info.call_id)
  twilio_client.api.calls(info.call_id).recordings.list()
  .then((data) => {
    // console.log(data)
    // resj
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

exports.stranger_call = function(req, res, next) {
  console.log(req.body)
}
