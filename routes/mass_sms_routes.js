const twilio_client = require('../twilio_setup').generate_twilio_client();
const notifyServicesSid = process.env.NOTIFY_SERVICE_ID
const formattedPhoneNumber = require('../api/general_api').formattedPhoneNumber
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
      insertCommunicationsLog({
        'ACTION': 'RENTHERO_SMS',
        'DATE': new Date().getTime(),
        'COMMUNICATION_ID': shortid.generate(),

        'SENDER_ID': 'RentHeroSMS',
        'SENDER_CONTACT_ID': 'RentHeroSMS',
        'RECEIVER_CONTACT_ID': user.phone,
        'RECEIVER_ID': user.tenant_id,
        'PROXY_CONTACT_ID': 'RENTHERO_INITIAL',
        'TEXT': message,
      })
    })
    res.json({
      message: 'SMS sent',
      notification_id: notification.id,
    })
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
    insertCommunicationsLog({
      'ACTION': 'RENTHERO_SMS',
      'DATE': new Date().getTime(),
      'COMMUNICATION_ID': shortid.generate(),

      'SENDER_ID': 'RentHeroSMS',
      'SENDER_CONTACT_ID': 'RentHeroSMS',
      'RECEIVER_CONTACT_ID': recipient.phone,
      'RECEIVER_ID': recipient.tenant_id,
      'PROXY_CONTACT_ID': recipient.proxy_contact_id,
      'TEXT': message,
    })
    res.json({
      message: 'SMS sent',
      notification_id: notification.id,
    })
  })
  .catch(error => {
    console.log(error)
    res.status(500).send('Error occurred sending SMS notification')
  })

}

exports.receive_message_from_phone = function(req, res, next) {
  const info = req.body
  console.log(info)

  get_tenant_id_from_phone(info.From)
  .then((data) => {
    console.log(data)
    if (data && data.tenant_id) {
      insertCommunicationsLog({
        'ACTION': 'RENTHERO_SMS',
        'DATE': new Date().getTime(),
        'COMMUNICATION_ID': shortid.generate(),

        'SENDER_CONTACT_ID': info.From,
        'SENDER_ID': data.tenant_id,
        'RECEIVER_CONTACT_ID': 'RentHeroSMS',
        'RECEIVER_ID': 'RentHeroSMS',
        'PROXY_CONTACT_ID': info.To,
        'TEXT': info.Body,
      })
    } else {
      insertCommunicationsLog({
        'ACTION': 'RENTHERO_SMS',
        'DATE': new Date().getTime(),
        'COMMUNICATION_ID': shortid.generate(),

        'SENDER_CONTACT_ID': info.From,
        'SENDER_ID': 'NOT_A_TENANT',
        'RECEIVER_CONTACT_ID': 'RentHeroSMS',
        'RECEIVER_ID': 'RentHeroSMS',
        'PROXY_CONTACT_ID': info.To,
        'TEXT': info.Body,
      })
    }
  })
}

exports.send_tenant_wait_msg = function(req, res, next) {
  const info = req.body
  const tenant = info.tenant
  const building = info.building
  const message = `Hello ${tenant.first_name}, an agent will contact you shortly regarding your inquiry for ${building.building_alias}. -- The Renthero Team`

  twilio_client.notify.services(notifyServicesSid).notifications.create({
    toBinding: JSON.stringify({ binding_type: 'sms', address: formattedPhoneNumber(tenant.phone), }),
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
      'COMMUNICATION_ID': shortid.generate(),

      'SENDER_ID': 'RentHeroSMS',
      'SENDER_CONTACT_ID': 'RentHeroSMS',
      'RECEIVER_CONTACT_ID': tenant.phone,
      'RECEIVER_ID': tenant.tenant_id,
      'PROXY_CONTACT_ID': 'RENTHERO SMS',
      'TEXT': message,
    })
    res.json({
      message: 'SMS sent',
    //  notification_id: notification.id,
    })
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
