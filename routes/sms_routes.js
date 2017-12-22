const twilio_client = require('../twilio_setup').generate_twilio_client();
// const twiml_client = new require('../twilio_setup').generate_twiml_client()
const uuid = require('uuid')
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const VoiceResponse = require('twilio').twiml.VoiceResponse;

const messagingServiceSid = 'MG7b2fbcc0003b6a821cc6e8f862e6b6e6'

const gatherOutgoingNumber = require('../api/sms_routing').gatherOutgoingNumber
const getLandlordInfo = require('./PropertyDB/Queries/LandlordQuery').get_landlord_info
const insert_sms_match = require('./LeasingDB/Queries/SMSQueries').insert_sms_match
const update_sms_match = require('./LeasingDB/Queries/SMSQueries').update_sms_match
const get_tenant_landlord_match = require('./LeasingDB/Queries/SMSQueries').get_tenant_landlord_match
const get_tenant_landlord_twilio_numbers = require('./LeasingDB/Queries/SMSQueries').get_tenant_landlord_twilio_numbers

const generateInitialMessageBody_Tenant = require('../api/initial_message').generateInitialMessageBody_Tenant
const generateInitialMessageBody_Landlord = require('../api/initial_message').generateInitialMessageBody_Landlord

const insertSMSLog = require('../message_logs/dynamodb_api').insertSMSLog
// const json = require('json')
const formattedPhoneNumber = require('../api/general_api').formattedPhoneNumber
// const { flask, request } = require('flask')
// POST /initil
// for those initial sms messages
exports.initial = function(req, res, next) {
  console.log('---------------- Initial message ----------------')
  const info = req.body

  let tenantPhone = formattedPhoneNumber(info.phone)
  let landlordPhone = ''
  let landlordName = ''
  let totalServiceNumbers
  let serviceNumbers

  // respond with twilio number if match already exists

  getLandlordInfo(info.building_id).then((landlord_details) => {
    landlordPhone = formattedPhoneNumber(landlord_details.phone)
    landlordName = landlord_details.corporation_name

    const service = twilio_client.messaging.services(messagingServiceSid)
    service.phoneNumbers.list()
    .then((data) => {
      serviceNumbers = data.map(s => s.phoneNumber)
      totalServiceNumbers = data.length
    })
    .catch((err) => {
      console.log('Error: ', err)
    })

    return get_tenant_landlord_match(tenantPhone, landlordPhone)
  })
  .then((data) => {
    console.log(data)
    if (data && data.twilio_phone) {
      console.log('MATCH ALREADY EXISTS')
      console.log('EXISTING TWILIO NUMBER: ', data.twilio_phone)
      // log that user and landlord mapping already exist. log(tenantPhone, [info.first_name, info.last_name].join(' '), landlordPhone, landlordName)

      sendSMSToTenant(info, { landlordName: landlordName, landlordPhone: landlordPhone }, { tenantPhone: tenantPhone }, data.twilio_phone)
    } else {
      return get_tenant_landlord_twilio_numbers(tenantPhone, landlordPhone)
      .then((data) => {
        const dbtwilio_numbers = data.map(s => s.twilio_phone)
        if (dbtwilio_numbers.length >= totalServiceNumbers) {
          console.log('BUY A NEW NUMBER')
          buyNewTwilioNumber()
          .then((purchasedTwilioNumber) => {
            console.log('PURCHASED TWILIO NUMBER: ', purchasedTwilioNumber)
            // log bought a new number: purchasedTwilioNumber for mapping tenantPhone and landlordPhone
            return sendSMSToTenantAndLandlord(info, { landlordName: landlordName, landlordPhone: landlordPhone }, { tenantPhone: tenantPhone }, purchasedTwilioNumber)
          })
        } else {
          console.log('USE EXISTING NUMBER')
          const selected_twilio_number = serviceNumbers.filter(val => !dbtwilio_numbers.includes(val))[0]
          console.log('SELECTED TWILIO NUMBER: ', selected_twilio_number)
          return sendSMSToTenantAndLandlord(info, { landlordName: landlordName, landlordPhone: landlordPhone }, { tenantPhone: tenantPhone }, selected_twilio_number)
        }
      })
    }
  })
  .then((data) => {
    res.json({
      message: 'Success'
    })
  })
}

const sendSMSToTenant = (info, tenant, landlord, twilioPhone) => {
  generateInitialMessageBody_Tenant(info, landlord.landlordName)
  .then((tenantBody) => {
    // step 3B: send initial message to tenant
    return twilio_client.messages.create({
      body: tenantBody,
      to: tenant.tenantPhone,
      from: twilioPhone,
    })
    // log this! body, to, from
  })
}

const sendSMSToTenantAndLandlord = (info, landlord, tenant, twilioPhone) => {
  generateInitialMessageBody_Tenant(info, landlord.landlordName)
  .then((tenantBody) => {
    // step 3B: send initial message to tenant
    return twilio_client.messages.create({
      body: tenantBody,
      to: tenant.tenantPhone,
      from: twilioPhone,
      // messagingServiceSid: messagingServiceSid // From a valid Twilio number
    })

    // log message sent to tenant
  })
  .then((message) => {
    return insert_sms_match(tenant.tenantPhone, landlord.landlordPhone, message.sid, twilioPhone)
  })
  .then(() => {
    // generate initial message to landlord
    return generateInitialMessageBody_Landlord(info, landlord.landlordName)
  })
  .then((landlordBody) => {
    // send initial message to landlord
    return twilio_client.messages.create({
      body: landlordBody,
      to: landlord.landlordPhone,
      from: twilioPhone,
      // messagingServiceSid: messagingServiceSid // From a valid Twilio number
    })

    // log message sent to landlord
  })
  .then((message) => {
    // step 5: done, twilio will handle the rest of the messages
    //console.log(message)
    console.log('MESSAGE SENT TO TENANT AND LANDLORD')
  }).catch((err) => {
    console.log('ERROR OCCURRED')
    console.log(err)
  })
}

const buyNewTwilioNumber = () => {
  let purchasedTwilioNumber
  return twilio_client.availablePhoneNumbers('CA').local
  .list({
    inRegion: 'ON',
    smsEnabled: true,
    mmsEnabled: true,
    voiceEnabled: true,
  })
  .then((data) => {
    const number = data[0]
    purchasedTwilioNumber = number.phoneNumber
    return twilio_client.incomingPhoneNumbers.create({
      phoneNumber: number.phoneNumber,
      voiceUrl: 'https://f4cf5498.ngrok.io/use-voice',
    })
  })
  .then((purchasedNumber) => {
    const service = twilio_client.messaging.services(messagingServiceSid)
    return service.phoneNumbers.create({
      phoneNumberSid: purchasedNumber.sid,
    })
  })
  .then((data) => {
    return purchasedTwilioNumber
  })
  .catch((err) => {
    console.log('Error', err)
  })
}

// POST /sms
exports.sms = function(req, res, next) {
  console.log('/sms')
  const twiml_client = new MessagingResponse();

  let from = req.body.From
  let to   = req.body.To
  let body = req.body.Body

  console.log(from, to)

   gatherOutgoingNumber(from, to)
    .then((outgoingPhoneNumber) => {
      console.log('outgoingPhoneNumber: ', outgoingPhoneNumber)
      console.log('messaging...')

      // log from, to, body, outgoingPhoneNumber

      twiml_client.message({
        to: outgoingPhoneNumber,
      }, body)
      insertSMSLog(req.body)
      console.log(twiml_client.toString())
      console.log('========>>>>>>>>>>>>>>>>>>>')
      res.type('text/xml');
      res.send(twiml_client.toString())
    })
}

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
      // voiceResponse.play('http://howtodocs.s3.amazonaws.com/howdy-tng.mp3')
       const dial = voiceResponse.dial({ callerId: to })
       dial.number(outgoingPhoneNumber)
       // const gather = voiceResponse.gather({
       //   input: 'speech dtmf'
       // })

       console.log(voiceResponse.toString())
       res.type('text/xml')
       res.send(voiceResponse.toString())
    })
}

exports.stickysms = function(req, res, next) {
  const accountSid = 'AC3cfc4b5a78368f2cdb70baf2c945aee7';
  const authToken = 'fcba843d429e6b0f859075c7e413a99b';

  const client = require('twilio')(accountSid, authToken);
  // const service = client.messaging.services('MG7b2fbcc0003b6a821cc6e8f862e6b6e6');
  //
  // service.phoneNumbers.list()
  //        .then(function(response) {
  //          console.log(response);
  //        }).catch(function(error) {
  //          console.log(error);
  //        });

  client.messages.create({
    messagingServiceSid: 'MG7b2fbcc0003b6a821cc6e8f862e6b6e6',
    to: '+16475286355',
    body: 'Hello World'
  })
  .then((message) => console.log(message))

}

exports.listener = function(req, res, next ) {
  const info = req.body

  const phone = info.From
  const sid = info.SmsSid

  console.log(phone, sid)

  update_sms_match(phone, sid)
}

exports.send_group_invitation_sms = function(req, res, next) {
  console.log('Send group invitation sms')
  const info = req.body
  const twiml_client = new MessagingResponse()


  const name = info.invitee_first_name
  const phone = info.phone
  const email = info.email
  const group_id = info.group_id
  const referrer = info.referrer
  const magic_link_id = uuid.v4()
  const invitation = info.invitation_id

  const from = '+12268940470'
  const to   = formattedPhoneNumber(info.phone)
  const link = `http://localhost:4001/invitation?${encodeURIComponent(
    `name=${name}&phone=${phone}&email=${email}&group=${group_id}&referrer=${referrer}&magic=${magic_link_id}&invitation=${invitation}`
  )}`
  const body = `Hello, You've been invited to join a group on RentHero. Please sign up using this link! ${link}`

  console.log(from, to)

  twilio_client.messages.create({
    body: body,
    from: from,
    to: to,
  })

  console.log(twiml_client.toString())
  console.log('========>>>>>>>>>>>>>>>>>>>')
  res.type('text/xml');
  res.send(twiml_client.toString())
}
// POST /fallback
exports.fallback = function(req, res, next) {
  console.log('FALLBACK')
  // console.log(req.body)
}

exports.speechtotext = function(req, res, next) {
  console.log(req.body)
}

// exports.send_mass_text_message = function(req, res, next) {
//   console.log('/sms')
//   const twiml_client = new MessagingResponse();
//
//   let from = req.body.From
//   let to   = req.body.To
//   let body = req.body.Body
//
//   const outgoingPhoneNumber
//
//    gatherOutgoingNumber(from, to)
//     .then((outgoingPhoneNumber) => {
//       console.log('outgoingPhoneNumber: ', outgoingPhoneNumber)
//       console.log('messaging...')
//
//       twiml_client.message({
//         to: outgoingPhoneNumber,
//       }, body)
//       insertSMSLog(req.body)
//       console.log(twiml_client.toString())
//       console.log('========>>>>>>>>>>>>>>>>>>>')
//       res.type('text/xml');
//       res.send(twiml_client.toString())
//     })
// }
