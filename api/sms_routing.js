const get_sms_match = require('../routes/LeasingDB/Queries/SMSQueries').get_sms_match

exports.gatherOutgoingNumber = function(incomingPhoneNumber, anonymousPhoneNumber){
  const p = new Promise((res, rej) => {

   // const hostPhoneNumber = '+15195726998'
   // const guestPhoneNumber = '+16475286355'
   get_sms_match(incomingPhoneNumber, anonymousPhoneNumber)
   .then((data) => {
     console.log('==========SMS MATCH QUERIED =========')
     if (data && data.tenant_phone) {
       console.log('yes yes tenant phone')
       const tenantPhoneNumber = data.tenant_phone
       const landlordPhoneNumber = data.landlord_phone

       let outgoingPhoneNumber


       // Connect from tenant to landlord
       if (tenantPhoneNumber === incomingPhoneNumber) {
          outgoingPhoneNumber = landlordPhoneNumber
        }

        // Connext from landlord to tenant
       if (landlordPhoneNumber === incomingPhoneNumber) {
          outgoingPhoneNumber = tenantPhoneNumber
        }
        res(outgoingPhoneNumber)
     } else {
       console.log('Tenant Phone DNE')
       res('')
     }

   })
  })
  return p
}


exports.gatherOutgoingNumberWithObject = function(incomingPhoneNumber, anonymousPhoneNumber){
  const p = new Promise((res, rej) => {

   get_sms_match(incomingPhoneNumber, anonymousPhoneNumber)
   .then((data) => {
     console.log('==========SMS MATCH QUERIED =========')
     if (data && data.tenant_phone) {
       console.log('yes yes tenant phone')
       const tenantPhoneNumber = data.tenant_phone
       const tenantId = data.tenant_id
       const landlordPhoneNumber = data.landlord_phone
       const landlordId = data.landlord_id

       let outgoingPhoneNumber


       // Connect from tenant to landlord
       if (tenantPhoneNumber === incomingPhoneNumber) {
          outgoingPhoneNumber = landlordPhoneNumber
        }

        // Connext from landlord to tenant
       if (landlordPhoneNumber === incomingPhoneNumber) {
          outgoingPhoneNumber = tenantPhoneNumber
        }
        res({
          outgoingPhoneNumber,
          tenantPhoneNumber,
          landlordPhoneNumber,
          tenantId,
          landlordId,
        })
     } else {
       console.log('Tenant Phone DNE')
       res('')
     }

   })
  })
  return p
}
