const twilio_client = require('../../twilio_setup').generate_twilio_client()
const determine_new_twilio_number = require('../../api/select_number_api').determine_new_twilio_number
const verifiedPhoneNumber = require('../../api/general_api').verifiedPhoneNumber
const insertCommunicationsLog = require('../../message_logs/dynamodb_api').insertCommunicationsLog
const insert_sms_match = require('../LeasingDB/Queries/SMSQueries').insert_sms_match
const shortid = require('shortid')
const generate_error_email = require('../../api/error_api').generate_error_email

exports.apollo_connect_with_tenant = function(req, res, next) {
  const info = req.body

  send_apollo_initial_message(info.tenant, info.employee)
  .then((data) => {
    res.json({
      message: `Successfully Connected ${info.tenant.first_name} ${info.tenant.last_name} to ${info.employee.first_name} ${info.employee.last_name}.`,
      twilioPhone: data,
    })
  })
  .catch((err) => {
    console.log('apollo_connect_with_tenant: ', err)
    res.status(500).send(`Failed to connect ${info.tenant.first_name} ${info.tenant.last_name} to ${info.employee.first_name} ${info.employee.last_name}`)
  })
}

// send_apollo_initial_message
//    this function will create a mapping between a tenant and an employee,
//    but a message will only be sent to the employee
const send_apollo_initial_message = function(tenant, employee) {
  const p = new Promise((res, rej) => {
    console.log('send_apollo_inital_message: ', tenant, employee)
    let tenantPhone = tenant.phone
    let employeePhone = employee.phone
    let twilioPhone
    const commsID = shortid.generate()
    const message = `You are now connected with ${tenant.first_name} ${tenant.last_name}.\n[ VERIFIED APOLLO MESSAGE: RentHero.cc/m/${commsID} ]`

    verifiedPhoneNumber(tenant.phone)
    .then((verifiedPhone) => {
      tenantPhone = verifiedPhone
      return verifiedPhoneNumber(employee.phone)
    })
    .then((verifiedPhone) => {
      employeePhone = verifiedPhone
      return determine_new_twilio_number(tenantPhone, employeePhone)
    })
    .then((twilioNumber) => {
      twilioPhone = twilioNumber

      return twilio_client.messages.create({
        to: employeePhone,
        from: twilioNumber,
        body: message,
      })
    })
    .then((data) => {
      return insert_sms_match(tenant.tenant_id, tenantPhone, employee.employee_id, employeePhone, data.sid, twilioPhone)
    })
    .then((data) => {

        insertCommunicationsLog({
          'ACTION': 'APOLLO_CONNECT',
          'DATE': new Date().getTime(),
          'COMMUNICATION_ID': commsID,
          'MEDIUM': 'SMS',

          'SENDER_ID': twilioPhone,
          'SENDER_CONTACT_ID': twilioPhone,
          'RECEIVER_CONTACT_ID': employee.employee_id,
          'RECEIVER_ID': employeePhone,
          'PROXY_CONTACT_ID': twilioPhone,
          'TEXT': message,
        })
        res(twilioPhone)
    })
    .catch((err) => {
      const additionalData = `Tenant ID: ${tenant.tenant_id}, Tenant Name: ${tenant.first_name} ${tenant.last_name}, Tenant Phone: ${tenantPhone.length > 0 ? tenantPhone : tenant.phone}\nEmployee ID: ${employee.employee_id}, Employee Name: ${employee.first_name} ${employee.last_name}, Employee Phone: ${employeePhone.length > 0 ? employeePhone : employee.phone}\nTwilio Number: ${twilioPhone}`
      generate_error_email(JSON.stringify(err), 'send_apollo_initial_message', additionalData)
      rej('error')
    })
  })
  return p
}
