const twilio_client = require('../twilio_setup').generate_twilio_client()
const determine_new_twilio_number = require('../api/select_number_api').determine_new_twilio_number
const verifiedPhoneNumber = require('../api/general_api').verifiedPhoneNumber

const insertCommunicationsLog = require('../message_logs/dynamodb_api').insertCommunicationsLog
const insert_sms_match = require('./LeasingDB/Queries/SMSQueries').insert_sms_match
const shortid = require('shortid')

const generate_error_email = require('../api/error_api').generate_error_email

exports.set_mapping_with_tenant = function(req, res, next) {
  const info = req.body
  const message = `You are now connected with ${info.tenant.first_name} ${info.tenant.last_name}.`

  send_renthero_inital_message(info.tenant, info.staff, message)
  .then((data) => {
    res.json({
      message: 'successfully mapped staff to tenant',
      twilioPhone: data,
    })
  })
  .catch((err) => {
    console.log('set_mapping_with_tenant: ', err)
    res.status(500).send('Failed to map staff to tenant')
  })
}


const send_renthero_inital_message = function(tenant, staff, message) {
  const p = new Promise((res, rej) => {
    console.log('send_renthero_inital_message: ', tenant, staff, message)
    let tenantPhone = tenant.phone
    let staffPhone = staff.phone
    let twilioPhone

    verifiedPhoneNumber(tenant.phone)
    .then((verifiedNumber) => {
      tenantPhone = verifiedNumber
      return verifiedPhoneNumber(staff.phone)
    })
    .then((verifiedNumber) => {
      staffPhone = verifiedNumber
      return determine_new_twilio_number(tenantPhone, staffPhone)
    })
    .then((twilioNumber) => {
      twilioPhone = twilioNumber

      twilio_client.messages.create({
        to: staff.phone,
        from: twilioNumber,
        body: message,
      })
      .then((data) => {
        return insert_sms_match(tenant.tenant_id, tenantPhone, staff.staff_id, staffPhone, data.sid, twilioPhone)
      })
      .then((data) => {
        insertCommunicationsLog({
          'ACTION': 'RENTHERO_SMS',
          'DATE': new Date().getTime(),
          'COMMUNICATION_ID': shortid.generate(),
          'MEDIUM': 'SMS',

          'SENDER_ID': twilioPhone,
          'SENDER_CONTACT_ID': twilioPhone,
          'RECEIVER_CONTACT_ID': staff.staff_id,
          'RECEIVER_ID': staffPhone,
          'PROXY_CONTACT_ID': twilioPhone,
          'TEXT': message,
        })
        res(twilioPhone)
      })
      .catch((error) => {
        console.log('send_renthero_inital_message: ', error)
        generate_error_email(JSON.stringify(error), 'send_renthero_inital_message', `tenantID: ${tenant.tenant_id}, tenantPhone: ${tenantPhone}, staffID: ${staff.staff_id}, staffPhone: ${staffPhone}, twilioPhone: ${twilioPhone}`)
        rej('error')
      })
    })
  })
  return p
}
