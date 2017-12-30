const AWS = require('aws-sdk')
const aws_config = require('../../../credentials/aws_config')
const COMMUNICATIONS_HISTORY = require('../dynamodb_tablenames').COMMUNICATIONS_HISTORY
AWS.config.update(aws_config)


const communicationsHistoryTableParams = {
    TableName : COMMUNICATIONS_HISTORY,
    KeySchema: [
        // USE CASE: ALLOWS ME TO SEE ALL USER PREFERENCES INTEL IN CHRONOLOGICAL ORDER. EG: USER LOOKS FOR ENSUITE FIRST BEFORE CHANGING THEIR FILTERS TO LOOK FOR LESS ROOMATES NO ENSUITE
        { AttributeName: "SENDER_CONTACT_ID", KeyType: "HASH" },  //Partition key
        { AttributeName: "DATE", KeyType: "RANGE" },  //Sort key
    ],
    AttributeDefinitions: [
        { AttributeName: "SENDER_CONTACT_ID", AttributeType: "S" },       // a phone, email, fb messenger id (of the sender)
        { AttributeName: "PROXY_CONTACT_ID", AttributeType: "S" },        // a twilio number, a email forwarder client, a facebook chat thread
        { AttributeName: "RECEIVER_CONTACT_ID", AttributeType: "S" },     // a phone, email, fb messenger id (of the receiver)
        { AttributeName: "DATE", AttributeType: "N" },
        { AttributeName: "ACTION", AttributeType: "S" },
        { AttributeName: "COMMUNICATION_ID", AttributeType: "S" },
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 5,
    },
    LocalSecondaryIndexes: [
      {
        // USE CASE: ALLOWS ME TO SHOW ALL USER PREFERENCES INTEL GROUPED BY ACTION. EG: I CAN SHOW THE TRENDS OF A USER ADJUSTING THEIR RENT PRICE THROUGHOUT THEIR 4 YEARS IN UNIVERSITY
        IndexName: 'By_Local_Sender_vs_Receiver', /* required */
        KeySchema: [ /* required */
          {
            AttributeName: 'SENDER_CONTACT_ID', /* required */
            KeyType: 'HASH' /* required */
          },
          {
            AttributeName: 'RECEIVER_CONTACT_ID', /* required */
            KeyType: 'RANGE' /* required */
          }
          /* more items */
        ],
        Projection: { /* required */
          ProjectionType: 'ALL'
        }
      },
      /* more items */
    ],
    GlobalSecondaryIndexes: [
      {
        // USE CASE: ALLOWS ME TO SEE ALL INTEL OF A SPECIFIC ACTION, GROUPED BY USERS. EG: SHOW ME ALL PRICE ADJUSTMENTS, AND NOW I CAN GROUP USER POPULATIONS INTO PRICE RANGES.
        IndexName: 'By_Action', /* required */
        KeySchema: [ /* required */
          {AttributeName: 'ACTION', KeyType: 'HASH'},
          {AttributeName: 'DATE', KeyType: 'RANGE'}
        ],
        Projection: { /* required */
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: { /* required */
          ReadCapacityUnits: 1, /* required */
          WriteCapacityUnits: 5 /* required */
        }
      },
      {
        // USE CASE: ALLOWS ME TO SEE ALL INTEL OF A SPECIFIC ACTION, GROUPED BY USERS. EG: SHOW ME ALL PRICE ADJUSTMENTS, AND NOW I CAN GROUP USER POPULATIONS INTO PRICE RANGES.
        IndexName: 'By_RECEIVER_CONTACT_ID', /* required */
        KeySchema: [ /* required */
          {AttributeName: 'RECEIVER_CONTACT_ID', KeyType: 'HASH'},
          {AttributeName: 'DATE', KeyType: 'RANGE'}
        ],
        Projection: { /* required */
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: { /* required */
          ReadCapacityUnits: 1, /* required */
          WriteCapacityUnits: 5 /* required */
        }
      },
      {
        // USE CASE: ALLOWS ME TO SEE ALL INTEL OF A SPECIFIC ACTION, GROUPED BY USERS. EG: SHOW ME ALL PRICE ADJUSTMENTS, AND NOW I CAN GROUP USER POPULATIONS INTO PRICE RANGES.
        IndexName: 'By_SENDER_CONTACT_ID', /* required */
        KeySchema: [ /* required */
          {AttributeName: 'SENDER_CONTACT_ID', KeyType: 'HASH'},
          {AttributeName: 'DATE', KeyType: 'RANGE'}
        ],
        Projection: { /* required */
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: { /* required */
          ReadCapacityUnits: 1, /* required */
          WriteCapacityUnits: 5 /* required */
        }
      },
      {
        // USE CASE: ALLOWS ME TO SEE ALL INTEL OF A SPECIFIC ACTION, GROUPED BY USERS. EG: SHOW ME ALL PRICE ADJUSTMENTS, AND NOW I CAN GROUP USER POPULATIONS INTO PRICE RANGES.
        IndexName: 'By_PROXY_CONTACT_ID', /* required */
        KeySchema: [ /* required */
          {AttributeName: 'PROXY_CONTACT_ID', KeyType: 'HASH'},
          {AttributeName: 'DATE', KeyType: 'RANGE'}
        ],
        Projection: { /* required */
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: { /* required */
          ReadCapacityUnits: 1, /* required */
          WriteCapacityUnits: 5 /* required */
        }
      },
      {
        // USE CASE: ALLOWS ME TO SEE ALL INTEL OF A SPECIFIC ACTION, GROUPED BY USERS. EG: SHOW ME ALL PRICE ADJUSTMENTS, AND NOW I CAN GROUP USER POPULATIONS INTO PRICE RANGES.
        IndexName: 'By_COMMUNICATION_ID', /* required */
        KeySchema: [ /* required */
          {AttributeName: 'COMMUNICATION_ID', KeyType: 'HASH'},
          {AttributeName: 'DATE', KeyType: 'RANGE'}
        ],
        Projection: { /* required */
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: { /* required */
          ReadCapacityUnits: 5, /* required */
          WriteCapacityUnits: 5 /* required */
        }
      }
    ]
}

exports.createTables = function(){

  console.log("==> About to create DynamoDB tables!")

  const dynamodb = new AWS.DynamoDB({
    dynamodb: '2012-08-10',
    region: "us-east-1"
  })

  dynamodb.createTable(communicationsHistoryTableParams, function(err, data) {
      if (err)
          console.log(JSON.stringify(err, null, 2));
      else
          console.log(JSON.stringify(data, null, 2));
  })
}
