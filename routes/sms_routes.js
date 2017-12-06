const twilio_client = require('../twilio_setup').generate_twilio_client();
// const twiml_client = new require('../twilio_setup').generate_twiml_client()
const MessagingResponse = require('twilio').twiml.MessagingResponse;

const messagingServiceSid = 'MG7b2fbcc0003b6a821cc6e8f862e6b6e6'

const gatherOutgoingNumber = require('../api/sms_routing').gatherOutgoingNumber
const getLandlordInfo = require('./PropertyDB/Queries/LandlordQuery').get_landlord_info
const insert_sms_match = require('./LeasingDB/Queries/SMSQueries').insert_sms_match
const update_sms_match = require('./LeasingDB/Queries/SMSQueries').update_sms_match

const generateInitialMessageBody_Tenant = require('../api/initial_message').generateInitialMessageBody_Tenant
const generateInitialMessageBody_Landlord = require('../api/initial_message').generateInitialMessageBody_Landlord

const insertSMSLog = require('../message_logs/dynamodb_api').insertSMSLog

const formattedPhoneNumber = require('../api/general_api').formattedPhoneNumber

// POST /initial
// for those initial sms messages
exports.initial = function(req, res, next) {
  console.log('---------------- Initial message ----------------')
  const info = req.body

  let tenantPhone = formattedPhoneNumber(info.phone)
  let landlordPhone = ''
  let landlordName = ''

  // step 1: get the tenant phone
  getLandlordInfo(info.building_id).then((landlord_details) => {
    // console.log(landlord_details)
    landlordPhone = formattedPhoneNumber(landlord_details.phone)
    landlordName = landlord_details.corporation_name
    // step 3A: generate the initial message to tenant
    return generateInitialMessageBody_Tenant(info, landlordName)
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
  //  console.log(message)
    console.log('+++++++++++++++++')
    console.log(message.sid)
    return insert_sms_match(tenantPhone, landlordPhone, message.sid)
  })
  .then(() => {
    // step 4A: generate initial message to landlord
    return generateInitialMessageBody_Landlord(info, landlordName)
  })
  .then((landlordBody) => {
    // console.log(landlordBody)
    // console.log(landlordPhone)
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
    res.status(200).send()
    //console.log(message)
    // insertSMSLog(req.body)
  }).catch((err) => {
    console.log('ERROR OCCURRED')
    console.log(err)
  })
}

// POST /sms
exports.sms = function(req, res, next) {
console.log('/sms')
const twiml_client = new MessagingResponse();

let from = req.body.From
let to   = req.body.To
let body = req.body.Body

 gatherOutgoingNumber(from, to)
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

  update_sms_match(phone, sid)
}


// POST /fallback
exports.fallback = function(req, res, next) {
  console.log('FALLBACK')
  // console.log(req.body)
}
