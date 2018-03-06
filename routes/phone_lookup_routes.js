const twilio_client = require('../twilio_setup').generate_twilio_client();
const formattedPhoneNumber = require('../api/general_api').formattedPhoneNumber
const select_all_from_sms_map = require('./LeasingDB/Queries/SMSQueries').select_all_from_sms_map

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
  formattedPhoneNumber(req.body.phone)
  .then((data) => {
    console.log(data)
  })

}
