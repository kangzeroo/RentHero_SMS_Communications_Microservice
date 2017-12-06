const twilio_client = require('../twilio_setup').generate_twilio_client();
// const twiml_client = new require('../twilio_setup').generate_twiml_client()
const MessagingResponse = require('twilio').twiml.MessagingResponse;

const messagingServiceSid = 'MG7b2fbcc0003b6a821cc6e8f862e6b6e6'

const gatherOutgoingNumber = require('../api/sms_routing').gatherOutgoingNumber
const getLandlordInfo = require('../api/landlord_info').getLandlordInfo

const generateInitialMessageBody_Tenant = require('../api/initial_message').generateInitialMessageBody_Tenant
const generateInitialMessageBody_Landlord = require('../api/initial_message').generateInitialMessageBody_Landlord

const insertSMSLog = require('../message_logs/dynamodb_api').insertSMSLog


// POST /initial
// for those initial sms messages
exports.initial = function(req, res, next) {
  console.log('---------------- Initial message ----------------')
  const info = req.body

  let tenantPhone = info.phone
  let landlordPhone = ''
  let landlordName = ''

  // step 1: get the tenant phone
  getLandlordInfo(info.building_id).then((landlord_details) => {
    console.log(landlord_details)
    landlordPhone = landlord_details.landlord_phone
    landlordName = landlord_details.landlord_name
    // step 3A: generate the initial message to tenant
    return generateInitialMessageBody_Tenant(info, landlord_details.landlord_name)
  })
  .then((tenantBody) => {
    // step 3B: send initial message to tenant
    return twilio_client.messages.create({
      body: tenantBody,
      to: tenantPhone,
      messagingServiceSid: messagingServiceSid // From a valid Twilio number
    })
  })
  .then((message) => {
    console.log('MESSAGE SENT TO TENANT')
    // console.log(message)
    // step 4A: generate initial message to landlord
    return generateInitialMessageBody_Landlord(info, landlordName)
  })
  .then((landlordBody) => {
    console.log(landlordBody)
    console.log(landlordPhone)
    // step 4B: send initial message to landlord
    return twilio_client.messages.create({
      body: landlordBody,
      to: landlordPhone,
      messagingServiceSid: messagingServiceSid // From a valid Twilio number
    })
  })
  .then((message) => {
    // step 5: done, twilio will handle the rest of the messages
    console.log('MESSAGE SENT TO LANDLORD')
    // console.log(message)
    // insertSMSLog(req.body)
  }).catch((err) => {
    console.log('ERROR OCCURRED')
    console.log(err)
  })
  res.status(200).send()
}

// POST /sms
exports.sms = function(req, res, next) {
console.log('/sms')
const twiml_client = new MessagingResponse();

let from = req.body.From
let to   = req.body.To
let body = req.body.Body

 gatherOutgoingNumber(from)
  .then((outgoingPhoneNumber) => {
    console.log('outgoingPhoneNumber: ', outgoingPhoneNumber)
    console.log('messaging...')

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


// POST /fallback
exports.fallback = function(req, res, next) {
  console.log('FALLBACK')
  // console.log(req.body)
}
