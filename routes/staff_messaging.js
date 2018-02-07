const twilio_client = require('../twilio_setup').generate_twilio_client()
const determine_new_twilio_number = require('../api/select_number_api').determine_new_twilio_number
const formattedPhoneNumber = require('../api/general_api').formattedPhoneNumber
const insertCommunicationsLog = require('../message_logs/dynamodb_api').insertCommunicationsLog
const insert_sms_match = require('./LeasingDB/Queries/SMSQueries').insert_sms_match
const shortid = require('shortid')


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
    const tenantPhone = formattedPhoneNumber(tenant.phone)
    const staffPhone = formattedPhoneNumber(staff.phone)
    let twilioPhone
    determine_new_twilio_number(tenantPhone, staffPhone)
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
        rej('error')
      })
    })
  })
  return p
}
