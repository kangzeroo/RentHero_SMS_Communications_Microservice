const get_tenant_landlord_match = require('../routes/LeasingDB/Queries/SMSQueries').get_tenant_landlord_match
const get_tenant_landlord_twilio_numbers = require('../routes/LeasingDB/Queries/SMSQueries').get_tenant_landlord_twilio_numbers
const messagingServiceSid = process.env.MESSAGE_SERVICE_ID
const twilio_client = require('../twilio_setup').generate_twilio_client()

exports.determine_new_twilio_number = (tenantPhone, landlordPhone) => {
  const p = new Promise((res, rej) => {
    let serviceNumbers
    let totalServiceNumbers

    const service = twilio_client.messaging.services(messagingServiceSid)
    service.phoneNumbers.list()
    .then((data) => {
      serviceNumbers = data.map(s => s.phoneNumber)
      totalServiceNumbers = data.length
      return get_tenant_landlord_match(tenantPhone, landlordPhone)
    })
    .then((data) => {
      if (data && data.twilio_phone) {
        console.log('MATCH ALREADY EXISTS! USE EXISTING TWILIO #: ', data.twilio_phone)

        // twilioNumber = data.twilio_phone
        res(data.twilio_phone)
      } else {
        return get_tenant_landlord_twilio_numbers(tenantPhone, landlordPhone)
        .then((dbData) => {
          let dbtwilio_numbers
          if (dbData && dbData.length > 0) {
            dbtwilio_numbers = dbData.map(s => s.twilio_phone)
          } else {
            dbtwilio_numbers = []
          }
          if (dbtwilio_numbers.length >= totalServiceNumbers) {
            console.log('BUY A NEW NUMBER')
            return buyNewTwilioNumber()
            .then((purchasedTwilioNumber) => {
              console.log('PURCHASED TWILIO NUMBER: ', purchasedTwilioNumber)
              res(purchasedTwilioNumber)
            })
          } else {
            console.log('USE EXISTING NUMBER')
            let selected_twilio_number
            console.log(dbtwilio_numbers)
            console.log(serviceNumbers)
            if (dbtwilio_numbers && dbtwilio_numbers.length > 0 && serviceNumbers && serviceNumbers.length > 0) {
              selected_twilio_number = serviceNumbers.filter(val => !dbtwilio_numbers.includes(val))[0]
              console.log('selected_twilio_number-1', selected_twilio_number)
            } else {
              selected_twilio_number = serviceNumbers[0]
              console.log('selected_twilio_number-2', selected_twilio_number)
            }
            console.log('SELECTED TWILIO NUMBER: ', selected_twilio_number)
            res(selected_twilio_number)
          }
        })
      }
    })
  })
  return p
}

const buyNewTwilioNumber = () => {
  let purchasedTwilioNumber
  return twilio_client.availablePhoneNumbers('CA').local
  .list({
    areaCode: '519',
    smsEnabled: true,
    mmsEnabled: true,
    voiceEnabled: true,
  })
  .then((data) => {
    const number = data[0]
    purchasedTwilioNumber = number.phoneNumber
    return twilio_client.incomingPhoneNumbers.create({
      phoneNumber: number.phoneNumber,
      voiceUrl: 'https://rentburrow.com:3006/use-voice',
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
