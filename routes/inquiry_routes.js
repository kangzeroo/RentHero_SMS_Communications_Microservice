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
const send_initial_corporate_email = require('./email_routes').send_initial_corporate_email
const send_initial_corporate_sms = require('./sms_routes').send_initial_corporate_sms

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

exports.initial_corporate_inquiry = function(request, response, next) {
  const p = new Promise((res, rej) => {
    // 1. send an email to the landlord
    send_initial_corporate_email(request.body)
      .then((landlordObj) => {
        // 2. check if the landlord has a phone, and if so, send an SMS
        if (landlordObj.phone) {
          return send_initial_corporate_sms(request.body)
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

// POST /message_proof
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


// POST /get_most_recent_messages
exports.get_most_recent_messages = function(request, resolve, next) {
  console.log('get_most_recent_messages')
  // console.log(request.body)
  // resolve.json([])
  const p = new Promise((res, rej) => {

    const params = {
      "TableName": COMMUNICATIONS_HISTORY,
      "FilterExpression": "#DATE > :date",
      "ExpressionAttributeNames": {
        "#DATE": "DATE"
      },
      "ExpressionAttributeValues": {
        ":date": unixDateSince(30)
      }
    }
    let Items = []
    const onNext = ({ obs, params }) => {
      setTimeout(() => {
        console.log('OBSERVABLE NEXT')
        console.log('=========== accumlated size: ' + Items.length)
        docClient.scan(params, (err, data) => {
          if (err){
            console.log(err, err.stack); // an error occurred
            obs.error(err)
          }else{
            console.log(data);           // successful response
            Items = Items.concat(data.Items)
            if (data.LastEvaluatedKey) {
              params.ExclusiveStartKey = data.LastEvaluatedKey
              obs.next({
                obs,
                params
              })
            } else {
              obs.complete(data)
            }
          }
        })
      }, 1500)
    }
    Rx.Observable.create((obs) => {
      obs.next({
        obs,
        params
      })
    }).subscribe({
      next: onNext,
      error: (err) => {
        console.log('OBSERVABLE ERROR')
        console.log(err)
      },
      complete: (y) => {
        console.log('OBSERVABLE COMPLETE')
        console.log(Items.length)
        res(Items)
      }
    })
  }).then((data) => {
    resolve.json(data)
  }).catch((err) => {
    resolve.status(500).send(err)
  })
}

const unixDateSince = (numDays) => {
  const today = new Date()
  const todayUnix = today.getTime()
  const sinceUnix = todayUnix - (numDays*24*60*60*1000)
  return sinceUnix
}
