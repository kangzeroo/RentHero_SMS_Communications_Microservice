// AWS SES (Simple Email Service) for sending emails via Amazon
const AWS_SES = require('aws-sdk/clients/ses')
const AWS = require('aws-sdk/global')
const ses = new AWS_SES({
  region: 'us-east-1'
})

exports.generate_error_email = function(message, function_name, additionalData) {
  console.log('generating error email...')
  const p = new Promise((res, rej) => {
    const params = createInitialParams(message, function_name, additionalData)

    AWS.config.credentials.refresh(function() {
      ses.sendEmail(params, function(err, data) {
        if (err) {
          console.log(err)
          rej(err)
        } else {
          console.log(data);           // successful response
          res({
            message: 'Success! Error mail sent',
            data: data,
          })
        }
      })
    })
  })
  return p
}

function createInitialParams(message, function_name, additionalData) {
  const params = {
    Destination: {
      BccAddresses: [
        'email.records.rentburrow@gmail.com'
      ],
      CcAddresses: [],
      ToAddresses: ['support@renthero.ca']
    },
    Message: {
      Body: {
        Html: {
          Data: `${message}\n\n${additionalData}`,
          Charset: 'UTF-8'
        }
      },
      Subject: {
        Data: `ERROR-- ${function_name}`,
        Charset: 'UTF-8'
      },
    },
    Source: 'errors@renthero.cc',
    ReplyToAddresses: [],
    ReturnPath: 'errors@renthero.cc'
  }
  return params
}
