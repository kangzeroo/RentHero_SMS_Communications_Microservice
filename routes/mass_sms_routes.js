const twilio_client = require('../twilio_setup').generate_twilio_client();
const notifyServicesSid = process.env.NOTIFY_SERVICE_ID
const formattedPhoneNumber = require('../api/general_api').formattedPhoneNumber
const MessagingResponse = require('twilio').twiml.MessagingResponse

const shortid = require('shortid')
const get_tenant_id_from_phone = require('./LeasingDB/Queries/TenantQueries').get_tenant_id_from_phone
const generateInitialEmail = require('../api/ses_api').generateInitialEmail
const generateInitialCorporateEmail = require('../api/corporate_landlord_api').generateInitialCorporateEmail
const insertCommunicationsLog = require('../message_logs/dynamodb_api').insertCommunicationsLog


exports.send_message_to_phones = function(req, res, next) {
  const info = req.body
  const message = info.body

  const toBind = info.users.map((user) => {
    return JSON.stringify({ binding_type: 'sms', address: formattedPhoneNumber(user.phone), })
  })

  twilio_client.notify.services(notifyServicesSid).notifications.create({
    toBinding: toBind,
    body: message,
  })
  .then((notification) => {
    console.log(info.users)
    info.users.forEach((user) => {
      let message_id = shortid.generate()
      let full_message = `
        ${message}
        [ VERIFIED RENTHERO MESSAGE: RentHero.cc/m/${message_id} ]
      `
      insertCommunicationsLog({
        'ACTION': 'RENTHERO_SMS',
        'DATE': new Date().getTime(),
        'COMMUNICATION_ID': message_id,

        'SENDER_ID': 'RentHeroSMS',
        'SENDER_CONTACT_ID': 'RentHeroSMS',
        'RECEIVER_CONTACT_ID': user.phone || 'NONE',
        'RECEIVER_ID': user.tenant_id || 'NONE',
        'PROXY_CONTACT_ID': 'RENTHERO_INITIAL',
        'TEXT': full_message,

        'TENANT_ID': user.tenant_id,
        'LANDLORD_ID': 'RentHeroSMS',
      })
    })
    res.type('text/xml')
    res.send(twilio_client.toString())
  })
  .catch(error => {
    console.log(error)
    res.status(500).send('Error occurred sending SMS notification')
  })
}

exports.send_message_to_phone = function(req, res, next) {
  const info = req.body
  const recipient = info.recipient
  const message = info.message

  twilio_client.notify.services(notifyServicesSid).notifications.create({
    toBinding: JSON.stringify({ binding_type: 'sms', address: formattedPhoneNumber(recipient.phone), }),
    body: message,
  })
  .then((notification) => {
    let message_id = shortid.generate()
    const full_message = `
      ${message}
      [ VERIFIED RENTHERO MESSAGE: RentHero.cc/m/${message_id} ]
    `
    insertCommunicationsLog({
      'ACTION': 'RENTHERO_SMS',
      'DATE': new Date().getTime(),
      'COMMUNICATION_ID': message_id,

      'SENDER_ID': 'RentHeroSMS',
      'SENDER_CONTACT_ID': 'RentHeroSMS',
      'RECEIVER_CONTACT_ID': recipient.phone || 'NONE',
      'RECEIVER_ID': recipient.tenant_id || 'NONE',
      'PROXY_CONTACT_ID': recipient.proxy_contact_id || 'NONE',
      'TEXT': full_message,

      'TENANT_ID': recipient.tenant_id,
      'LANDLORD_ID': 'RentHeroSMS',
    })
    res.type('text/xml')
    res.send(twilio_client.toString())
  })
  .catch(error => {
    console.log(error)
    res.status(500).send('Error occurred sending SMS notification')
  })

}

exports.receive_message_from_phone = function(req, res, next) {
  const info = req.body
  console.log(info)
  const resp = new MessagingResponse()

  get_tenant_id_from_phone(info.From)
  .then((data) => {
    console.log(data)
    if (data && data.tenant_id) {
      insertCommunicationsLog({
        'ACTION': 'RENTHERO_SMS',
        'DATE': new Date().getTime(),
        'COMMUNICATION_ID': shortid.generate(),

        'SENDER_CONTACT_ID': info.From || 'NONE',
        'SENDER_ID': data.tenant_id || 'NONE',
        'RECEIVER_CONTACT_ID': 'RentHeroSMS',
        'RECEIVER_ID': 'RentHeroSMS' || 'NONE',
        'PROXY_CONTACT_ID': info.To || 'NONE',
        'TEXT': info.Body || 'NONE',

        'TENANT_ID': data.tenant_id,
        'LANDLORD_ID': 'RentHeroSMS',
      })
    } else {
      insertCommunicationsLog({
        'ACTION': 'RENTHERO_SMS',
        'DATE': new Date().getTime(),
        'COMMUNICATION_ID': shortid.generate(),

        'SENDER_CONTACT_ID': info.From || 'NONE',
        'SENDER_ID': 'NOT_A_TENANT',
        'RECEIVER_CONTACT_ID': 'RentHeroSMS',
        'RECEIVER_ID': 'RentHeroSMS',
        'PROXY_CONTACT_ID': info.To || 'NONE',
        'TEXT': info.Body || 'NONE',

        'TENANT_ID': 'NOT_A_TENANT',
        'LANDLORD_ID': 'RentHeroSMS',
      })
    }
    res.type('text/xml')
    res.send(resp.toString())
  }).catch((err) => {
    console.log(err)
    res.status(500).send({
      message: 'error'
    })
  })
}

exports.send_tenant_wait_msg = function(req, res, next) {
  const info = req.body
  const tenant = info.tenant
  const building = info.building
  const message_id = shortid.generate()
  const message = `
    Hello ${tenant.first_name}, an agent of the landlord will contact you shortly regarding your inquiry for ${building.building_alias}. -- The Renthero Team
    [ VERIFIED RENTHERO MESSAGE: RentHero.cc/m/${message_id} ]
  `

  twilio_client.notify.services(notifyServicesSid).notifications.create({
    toBinding: JSON.stringify({ binding_type: 'sms', address: formattedPhoneNumber(tenant.phone) }),
    body: message,
  })
  .then((notification) => {
    const landlordMsg = `https://renthero.cc/inquiries/${info.inquiry_id}`
    return generateInitialCorporateEmail([info.corporation_email], 'inquiries@renthero.cc', tenant, info.group_notes, landlordMsg, building, 'landlord')
  })
  .then((notification) => {
    insertCommunicationsLog({
      'ACTION': 'RENTHERO_SMS',
      'DATE': new Date().getTime(),
      'COMMUNICATION_ID': message_id,

      'SENDER_ID': info.corporation_id,
      'SENDER_CONTACT_ID': 'RentHeroSMS',
      'RECEIVER_CONTACT_ID': tenant.phone || 'NONE',
      'RECEIVER_ID': tenant.tenant_id || 'NONE',
      'PROXY_CONTACT_ID': 'RENTHERO SMS',
      'TEXT': message,
      'INQUIRY_ID': info.inquiry_id,

      'LANDLORD_NAME': building.building_alias,
    })
    res.type('text/xml')
    res.send(twilio_client.toString())
  })
  .catch(error => {
    console.log(error)
    res.status(500).send('Error occurred sending SMS notification')
  })



}

// SmsSid=SM8884665161e8ab18b988fd4e7f3945d3
// &SmsStatus=sent
// &MessageStatus=sent
// &To=%2B16475286355
// &MessagingServiceSid=MG4f645b25e4396614a92e6377ba73aff2
// &MessageSid=SM8884665161e8ab18b988fd4e7f3945d3
// &AccountSid=AC3cfc4b5a78368f2cdb70baf2c945aee7
// &From=%2B12892746748
// &ApiVersion=2010-04-01

// ToCountry=CA
// &ToState=ON
// &SmsMessageSid=SMbf505253cd06a3991e7274ba563dcf6e
// &NumMedia=0
// &ToCity=OSHAWA
// &FromZip=
// &SmsSid=SMbf505253cd06a3991e7274ba563dcf6e
// &FromState=ON
// &SmsStatus=received
// &FromCity=Toronto
// &Body=Shsjsjskksk
// &FromCountry=CA
// &To=%2B12892746748
// &MessagingServiceSid=MG4f645b25e4396614a92e6377ba73aff2
// &ToZip=
// &AddOns=%7B%22status%22%3A%22successful%22%2C%22message%22%3Anull%2C%22code%22%3Anull%2C%22results%22%3A%7B%22ibm_watson_sentiment%22%3A%7B%22request_sid%22%3A%22XR57eb9566574b2a88396ed8be632a07bf%22%2C%22status%22%3A%22successful%22%2C%22message%22%3Anull%2C%22code%22%3Anull%2C%22result%22%3A%7B%22status%22%3A%22OK%22%2C%22language%22%3A%22english%22%2C%22docSentiment%22%3A%7B%22type%22%3A%22neutral%22%7D%7D%7D%7D%7D
// &NumSegments=1
// &MessageSid=SMbf505253cd06a3991e7274ba563dcf6e
// &AccountSid=AC3cfc4b5a78368f2cdb70baf2c945aee7
// &From=%2B16475286355
// &ApiVersion=2010-04-01
