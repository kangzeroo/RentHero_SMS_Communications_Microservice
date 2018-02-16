const twilio_client = require('../twilio_setup').generate_twilio_client();
const notifyServicesSid = process.env.NOTIFY_SERVICE_ID
const formattedPhoneNumber = require('../api/general_api').formattedPhoneNumber
const MessagingResponse = require('twilio').twiml.MessagingResponse

const shortid = require('shortid')
const uuid = require('uuid')
const shortenUrl = require('../api/general_api').shortenUrl

const get_tenant_id_from_phone = require('./LeasingDB/Queries/TenantQueries').get_tenant_id_from_phone
const generateInitialEmail = require('../api/ses_api').generateInitialEmail
const generateInitialCorporateEmail = require('../api/corporate_landlord_api').generateInitialCorporateEmail
const insertCommunicationsLog = require('../message_logs/dynamodb_api').insertCommunicationsLog
const insertOrchestraLog = require('../message_logs/dynamodb_api').insertOrchestraLog


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
        'MEDIUM': 'SMS',

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
      'MEDIUM': 'SMS',

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

exports.send_group_invitation_sms = function(req, res, next) {
  console.log('Send group invitation sms')
  const info = req.body
  // const twiml_client = new MessagingResponse()
  const comm_id = shortid.generate()

  const referrer = info.referrer
  const referrer_tenant_id = info.referrer_tenant_id
  const referralcredit = info.referrer_short_id
  const referrer_phone = info.referrer_phone

  // invitee
  const name = info.invitee_first_name
  const phone = info.phone
  const email = info.email

  const group_id = info.group_id
  const group_alias = info.group_alias
  const magic_link_id = uuid.v4()
  const invitation = info.invitation_id

  const to   = formattedPhoneNumber(info.phone)
  const longUrl = `${req.get('origin')}/invitation?${encodeURIComponent(`name=${name}&phone=${phone}&email=${email}&group=${group_id}&referrer=${referrer}&magic=${magic_link_id}&invitation=${invitation}&group_alias=${group_alias}`)}&referralcredit=${referralcredit}`

  shortenUrl(longUrl).then((result) => {
    const body = `
      Hello, You've been invited by your friend ${referrer} to join a group on RentHero. Please sign up using this link! ${result.id}
      [ VERIFIED RENTHERO MESSAGE: RentHero.cc/m/${comm_id} ]
    `

    twilio_client.notify.services(notifyServicesSid).notifications.create({
      toBinding: JSON.stringify({ binding_type: 'sms', address: to, }),
      body: body,
    })
    // check out message_logs/schema/communications_history/communications_history_item to see a list of possible insertion entries
    insertCommunicationsLog({
      'ACTION': 'SENT_GROUP_INVITE',
      'DATE': new Date().getTime(),
      'COMMUNICATION_ID': comm_id,
      'PROXY_CONTACT_ID': 'RentHeroSMS',
      'SENDER_ID': referrer_tenant_id,
      'RECEIVER_ID': phone,
      'SENDER_CONTACT_ID': referrer_phone,
      'RECEIVER_CONTACT_ID': phone,
      'TEXT': body,
      'GROUP_ID': group_id,
      'INVITATION_ID': invitation,
      'MAGIC_LINK_ID': magic_link_id,
      'MEDIUM': 'SMS',
    })
    // for orchestra
    insertOrchestraLog({
      'ACTION': 'MAGIC_LINK_GROUP_SENT',
      'DATE': new Date().getTime(),
      'ORCHESTRA_ID': uuid.v4(),
      'MAGIC_LINK_ID': magic_link_id,
      'TARGET_ID': to,
      'TARGET_CONTACT_ID': to,
      'PROXY_CONTACT_ID': 'RentHeroSMS',
      'SENDER_ID': referrer_tenant_id,
      'SENDER_CONTACT_ID': referrer_phone,
      'GROUP_ID': group_id,
      'INVITATION_ID': invitation,
      'MEDIUM': 'SMS',
    })
    // console.log(twiml_client.toString())
    console.log('========>>>>>>>>>>>>>>>>>>>')
    res.type('text/xml');
    res.send(twilio_client.toString())
  }).catch((err) => {
    console.log(err)
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
        'MEDIUM': 'SMS',

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
        'MEDIUM': 'SMS',

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

exports.send_office_hours_ended_to_tenant = function(tenant, building, suite, corporation, group, inquiry_id) {
  const p = new Promise((res, rej) => {
    const message_id = shortid.generate()
    const message = `Hello ${tenant.first_name}, the office hours for the landlord has ended.
                     An agent landlord will contact you tomorrow
                     regarding your inquiry for ${building.building_alias}.
                     [ VERIFIED RENTHERO MESSAGE: RentHero.cc/m/${message_id} ]
                    `
    twilio_client.notify.services(notifyServicesSid).notifications.create({
      toBinding: JSON.stringify({
                    binding_type: 'sms',
                    address: formattedPhoneNumber(tenant.phone),
                }),
      body: message,
    })
    .then((notification) => {
      console.log('generating landlord email...')
      const landlordMsg = `https://renthero.cc/inquiries/${inquiry_id}`
      return generateInitialCorporateEmail(
                    [corporation.corporation_email],    // toEmailAddresses
                    'inquiries@renthero.cc',            // proxyFromEmailAddress
                    tenant,                             // tenant Object
                    group.group_notes,                  // Group Notes written by Tenant
                    landlordMsg,                        // Message to be sent to Landlord
                    building,                           // Building Object
                    suite                               // Suite Object
                  )
    })
    .then((notifications) => {
      insertCommunicationsLog({
        'ACTION': 'RENTHERO_SMS',
        'DATE': new Date().getTime(),
        'COMMUNICATION_ID': message_id,
        'MEDIUM': 'SMS',

        'SENDER_ID': corporation.corporation_id,
        'SENDER_CONTACT_ID': 'RentHeroSMS',
        'RECEIVER_CONTACT_ID': tenant.phone,
        'RECEIVER_ID': tenant.tenant_id,
        'PROXY_CONTACT_ID': 'RENTHERO SMS',
        'TEXT': message,
        'INQUIRY_ID': inquiry_id,

        'LANDLORD_NAME': building.building_alias,
      })
      res(inquiry_id)
    })
    .catch((error) => {
      console.log(error)
      rej(error)
    })
    .done()
  })
  return p
}


exports.send_wait_msg_to_tenant = function(tenant, building, suite, corporation, group, inquiry_id) {
  const p = new Promise((res, rej) => {
    const message_id = shortid.generate()
    const message = `Hello ${tenant.first_name}, an agent of the landlord will contact you shortly
                     regarding your inquiry for ${building.building_alias}.
                     [ VERIFIED RENTHERO MESSAGE: RentHero.cc/m/${message_id} ]
                    `
    twilio_client.notify.services(notifyServicesSid).notifications.create({
      toBinding: JSON.stringify({
                    binding_type: 'sms',
                    address: formattedPhoneNumber(tenant.phone),
                }),
      body: message,
    })
    .then((notification) => {
      console.log('generating landlord email...')
      const landlordMsg = `https://renthero.cc/inquiries/${inquiry_id}`
      return generateInitialCorporateEmail(
                    [corporation.corporation_email],    // toEmailAddresses
                    'inquiries@renthero.cc',            // proxyFromEmailAddress
                    tenant,                             // tenant Object
                    group.group_notes,                  // Group Notes written by Tenant
                    landlordMsg,                        // Message to be sent to Landlord
                    building,                           // Building Object
                    suite                               // Suite Object
                  )
    })
    .then((notifications) => {
      insertCommunicationsLog({
        'ACTION': 'RENTHERO_SMS',
        'DATE': new Date().getTime(),
        'COMMUNICATION_ID': message_id,
        'MEDIUM': 'SMS',

        'SENDER_ID': corporation.corporation_id,
        'SENDER_CONTACT_ID': 'RentHeroSMS',
        'RECEIVER_CONTACT_ID': tenant.phone,
        'RECEIVER_ID': tenant.tenant_id,
        'PROXY_CONTACT_ID': 'RENTHERO SMS',
        'TEXT': message,
        'INQUIRY_ID': inquiry_id,

        'LANDLORD_NAME': building.building_alias,
      })
      res(inquiry_id)
    })
    .catch((error) => {
      console.log(error)
      rej(error)
    })
    .done()
  })
  return p
}

exports.callback = function(req, res, next) {
  console.log('============== CALLBACK ==========')
  console.log(req.body)
  res.json({
    message: 'success'
  })
}

// exports.send_tenant_wait_msg = function(req, res, next) {
//   const info = req.body
//   const tenant = info.tenant
//   const building = info.building
//   const suite = info.suite
//   const message_id = shortid.generate()
//   const message = `
//     Hello ${tenant.first_name}, an agent of the landlord will contact you shortly regarding your inquiry for ${building.building_alias}.
//     [ VERIFIED RENTHERO MESSAGE: RentHero.cc/m/${message_id} ]
//   `
//
//   twilio_client.notify.services(notifyServicesSid).notifications.create({
//     toBinding: JSON.stringify({ binding_type: 'sms', address: formattedPhoneNumber(tenant.phone) }),
//     body: message,
//   })
//   .then((notification) => {
//     const landlordMsg = `https://renthero.cc/inquiries/${info.inquiry_id}`
//     return generateInitialCorporateEmail([info.corporation_email], 'inquiries@renthero.cc', tenant, info.group_notes, landlordMsg, building, suite, 'landlord')
//   })
//   .then((notification) => {
//     insertCommunicationsLog({
//       'ACTION': 'RENTHERO_SMS',
//       'DATE': new Date().getTime(),
//       'COMMUNICATION_ID': message_id,
//
//       'SENDER_ID': info.corporation_id,
//       'SENDER_CONTACT_ID': 'RentHeroSMS',
//       'RECEIVER_CONTACT_ID': tenant.phone || 'NONE',
//       'RECEIVER_ID': tenant.tenant_id || 'NONE',
//       'PROXY_CONTACT_ID': 'RENTHERO SMS',
//       'TEXT': message,
//       'INQUIRY_ID': info.inquiry_id,
//
//       'LANDLORD_NAME': building.building_alias,
//     })
//     res.type('text/xml')
//     res.send(twilio_client.toString())
//   })
//   .catch(error => {
//     console.log(error)
//     res.status(500).send('Error occurred sending SMS notification')
//   })
//
//
//
// }
