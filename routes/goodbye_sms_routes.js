const twilio_client = require('../twilio_setup').generate_twilio_client();

const getLandlordFromID = require('./PropertyDB/Queries/LandlordQuery').get_landlord_from_id
const getTenantFromID = require('./LeasingDB/Queries/TenantQueries').get_tenant_from_id

const generateGoodbyeMessageTenant = require('../api/goodbye_message').generateGoodbyeMessageTenant
const generateGoodbyeMessageLandlord = require('../api/goodbye_message').generateGoodbyeMessageLandlord
const formattedPhoneNumber = require('../api/general_api').formattedPhoneNumber

const shortid = require('shortid')


exports.send_goodbye_message_sms = function(req, res, next) {
  const info = req.body
  const tenant_id = info.tenant_id
  const landlord_id = info.landlord_id
  const twilio_phone = info.twilio_phone
  let tenant
  let landlord
  let tenantBody = ''
  let landlordBody = ''

  getTenantFromID(tenant_id)
  .then((data) => {
    tenant = data
    // console.log(data)
    return getLandlordFromID(landlord_id)
  })
  .then((data) => {
    landlord = data
    // console.log(data)
    return generateGoodbyeMessageLandlord(tenant, data.corporation_name, shortid.generate())
  })
  .then((data) => {
    // console.log(data)
    landlordBody = data
    return generateGoodbyeMessageTenant(tenant, landlord.corporation_name, shortid.generate())
  })
  .then((data) => {
    tenantBody = data
    return twilio_client.messages.create({
      body: landlordBody,
      to: formattedPhoneNumber(landlord.phone),
      from: twilio_phone,
    })
  })
  .then((data) => {
    return twilio_client.messages.create({
      body: tenantBody,
      to: formattedPhoneNumber(tenant.phone),
      from: twilio_phone,
    })
  })
  .then((data) => {
    // console.log(data)
    res.json({
      message: 'successfully said our goodbyes'
    })
  })
  .catch((err) => {
    console.log(err)
    res.status(500).send('Unable to send goodbye messages')
  })
}
