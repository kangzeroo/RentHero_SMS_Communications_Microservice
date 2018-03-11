const twilio_client = require('../twilio_setup').generate_twilio_client();
const unFormattedPhoneNumber = require('../api/general_api').unFormattedPhoneNumber
const get_tenant_id_from_phone = require('./LeasingDB/Queries/TenantQueries').get_tenant_id_from_phone

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
  get_tenant_id_from_phone('+15195726998')
  .then((data) => {
    console.log(data)
  })
}
