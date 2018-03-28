const twilio_client = require('../twilio_setup').generate_twilio_client();
const unFormattedPhoneNumber = require('../api/general_api').unFormattedPhoneNumber
const get_tenant_id_from_phone = require('./LeasingDB/Queries/TenantQueries').get_tenant_id_from_phone
const VoiceResponse = require('twilio').twiml.VoiceResponse;

exports.phone_lookup = function(req, res, next) {
  const info = req.body
  console.log('phone lookup: ', info.phone)

  twilio_client.lookups.v1
    .phoneNumbers(info.phone)
    .fetch()
    .then((data) => {
      console.log({
        message: 'Succesfully Verified Phone Number',
        formattedNumber: data.phoneNumber,
        nationalFormat: data.nationalFormat,
        countryCode: data.countryCode,
        callerName: data.callerName,
      })
      res.json({
        message: 'Succesfully Verified Phone Number',
        formattedNumber: data.phoneNumber,
        nationalFormat: data.nationalFormat,
        countryCode: data.countryCode,
        callerName: data.callerName,
      })
    })
    .catch((err) => {
      console.log(err)
      res.status(500).send('Not a valid phone number')
    })
}

exports.phone_test = function(req, res, next) {
  twilio_client.lookups.v1
  .phoneNumbers('+16502530000')
  .fetch({ addOns: 'whitepages_pro_caller_id' })
  .then(number => console.log(number));
}

exports.pre_call = function(req, res, next) {
  console.log(req.body)
  const voiceResponse = new VoiceResponse()
  voiceResponse.say({
    voice: 'man',
    language: 'en',
  },
   'this call may be recorded for quality and training purposes'
  )

  // const dial = voiceResponse.dial({ callerId: to, record: 'record-from-answer' })
}

exports.create_session = function(req, res, next) {
  twilio_client.proxy.services('KSa6f6884e2161ad79cea93c701fa65480')
  .sessions.create({
    uniqueName: 'MySecondSession',
  })
  .then((response) => {
    console.log(response)
  })
  .catch((err) => {
    console.log(err)
  })
}

exports.create_participant = function(req, res, next) {
  twilio_client.proxy.services('KSa6f6884e2161ad79cea93c701fa65480')
  .sessions('KCa6f2c8fac6896c560c8a482ce430079e')
  .participants.create({
    identifier: '+16475286355',
    unique_name: 'Jimmy Guo',
  })
  .then((response) => {
    console.log(response)
  })
  .catch((err) => {
    console.log(err)
    if (err.code === 80206) {
      console.log('errorrr')
      // buy a new twilio number
    }
  })
}
