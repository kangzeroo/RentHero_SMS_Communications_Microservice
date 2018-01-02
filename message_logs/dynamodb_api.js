
const AWS = require('aws-sdk')
const aws_config = require('../credentials/aws_config')
// const dynaDoc = require("dynamodb-doc");
AWS.config.update(aws_config)
const COMMUNICATIONS_HISTORY = require('./schema/dynamodb_tablenames').COMMUNICATIONS_HISTORY
const ORCHESTRA_ACTIVITY = require('./schema/dynamodb_tablenames').ORCHESTRA_ACTIVITY

// const dynamodb = new AWS.DynamoDB({
//   dynamodb: '2012-08-10',
//   region: "us-east-1"
// })
// const docClient = new dynaDoc.DynamoDB(dynamodb)
const docClient = new AWS.DynamoDB.DocumentClient()

exports.insertCommunicationsLog = function(intel){
  const p = new Promise((res, rej) => {
    console.log('============= ABOUT TO INSERT A COMMUNICATIONS LOG ==============')
    const item = {
      'TableName': COMMUNICATIONS_HISTORY,
      'Item': intel,
    }
    console.log(item)
    docClient.put(item, function(err, data) {
      if (err){
        console.log(err)
          // console.log(JSON.stringify(err, null, 2));
          rej(err)
      }else{
          console.log(data)
          console.log('INTEL INSERTION SUCCESS!')
          res()
      }
    })
  })
  return p
}

exports.insertOrchestraLog = function(intel){
  const p = new Promise((res, rej) => {
    console.log('============= ABOUT TO INSERT AN ORCHESTRA LOG ==============')
    const item = {
      'TableName': ORCHESTRA_ACTIVITY,
      'Item': intel,
    }
    console.log(item)
    docClient.putItem(item, function(err, data) {
      if (err){
          console.log(JSON.stringify(err, null, 2));
          rej()
      }else{
          console.log(data)
          console.log('INTEL INSERTION SUCCESS!')
          res()
      }
    })
  })
  return p
}
