const send_initial_email = require('./email_routes').send_initial_email
const send_initial_sms = require('./sms_routes').send_initial_sms

// POST /initial_inquiry
exports.initial_inquiry = function(request, response, next) {
  const p = new Promise((res, rej) => {
    // 1. send an email to the landlord
    send_initial_email(request.body)
      .then((landlordObj) => {
        // 2. check if the landlord has a phone, and if so, send an SMS
        if (landlordObj.phone) {
          return send_initial_sms(request.body)
        } else {
          return Promise.resolve()
        }
      })
      .then((data) => {
        console.log(data)
        response.json({
          status: 'Success'
        })
      })
      .catch((err) => {
        console.log(err)
        response.status(500).send(err)
      })
  })
  return p
}
