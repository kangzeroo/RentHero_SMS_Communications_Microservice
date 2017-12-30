const AWS = require('aws-sdk')
const aws_config = require('../../../credentials/aws_config')
// const TOUR_HINTS = require('../dynamodb_tablenames').TOUR_HINTS
// AWS.config.update(aws_config)


const tourHintsTableParams = {
    TableName : TOUR_HINTS,
    KeySchema: [
        // USE CASE: ALLOWS ME TO SEE ALL USER PREFERENCES INTEL IN CHRONOLOGICAL ORDER. EG: USER LOOKS FOR ENSUITE FIRST BEFORE CHANGING THEIR FILTERS TO LOOK FOR LESS ROOMATES NO ENSUITE
        { AttributeName: "DATE", KeyType: "HASH" },  //Partition key
        { AttributeName: "TOUR_HINT_ID", KeyType: "RANGE" },  //Sort key
    ],
    AttributeDefinitions: [
        { AttributeName: "DATE", AttributeType: "N" },
        { AttributeName: "TOUR_HINT_ID", AttributeType: "S" },
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 5,
    },
}

exports.createTables = function(){

  console.log("==> About to create DynamoDB tables!")

  const dynamodb = new AWS.DynamoDB({
    dynamodb: '2012-08-10',
    region: "us-east-1"
  })

  dynamodb.createTable(tourHintsTableParams, function(err, data) {
      if (err)
          console.log(JSON.stringify(err, null, 2));
      else
          console.log(JSON.stringify(data, null, 2));
  })
}
