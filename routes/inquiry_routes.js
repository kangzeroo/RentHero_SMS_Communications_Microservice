const AWS = require('aws-sdk')
const aws_config = require('../credentials/aws_config')
const COMMUNICATIONS_HISTORY = require('../message_logs/schema/dynamodb_tablenames').COMMUNICATIONS_HISTORY
const dynaDoc = require("dynamodb-doc")
AWS.config.update(aws_config)
const Rx = require('rxjs')

const dynamodb = new AWS.DynamoDB({
  dynamodb: '2012-08-10',
  region: "us-east-1"
})
const docClient = new dynaDoc.DynamoDB(dynamodb)

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

// GET /message_proof?id=989DSFH697
exports.message_proof = function(request, resolve, next) {
  const p = new Promise((res, rej) => {
    const comm_id = request.body.comm_id
    const params = {
      "TableName": COMMUNICATIONS_HISTORY,
      "FilterExpression": "#COMMUNICATION_ID = :comm_id",
      "ExpressionAttributeNames": {
        "#COMMUNICATION_ID": "COMMUNICATION_ID",
        "#DATE": "DATE",
        "#TEXT": "TEXT"
      },
      "ExpressionAttributeValues": {
        ":comm_id": comm_id,
      },
      "ProjectionExpression": "#COMMUNICATION_ID, #DATE, #TEXT"
    }
    docClient.scan(params, (err, data) => {
      if (err){
        console.log(err, err.stack); // an error occurred
        resolve.status(500).send({
          message: 'ERROR'
        })
      }else{
        console.log(data);           // successful response
        if (data.Items.length > 0 && data.Items[0].ACTION !== 'FORWARDED_MESSAGE') {
          resolve.json(data.Items[0])
        } else {
          resolve.status(500).send({
            message: 'NO SUCH COMMUNICATION'
          })
        }
      }
    })
  })
  return p
}
