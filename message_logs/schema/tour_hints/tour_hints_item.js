const COMMUNICATIONS_HISTORY = require('../dynamodb_tablenames').COMMUNICATIONS_HISTORY


// ====================================

exports.reference_items = [
  {
    'TableName': COMMUNICATIONS_HISTORY,
    'Item': {
      'ACTION': 'PARSED_TOUR_HINT',
      'TOUR_HINT_ID': 'uuid.v4()',
      'DATE': new Date().getTime(),
      'ORIGINAL_CONTENTS': 'JSON.stringify(original_contents)',

      'PROXY_CONTACT_ID': '983LIJSDFSDFLJ9',
      'SENDER_ID': 'SGF4534536565',
      'RECEIVER_ID': 'SDF4556485767',
      'SENDER_CONTACT_ID': '+134534536565',
      'RECEIVER_CONTACT_ID': '+14556485767',

      'TEXT': 'Yes there is availability...',

      'GUESSED_DATE': 'Jan 14th 2018 14:40pm',
      'VERIFIED': false,
      'NOTES': 'notes from the human',
    }
  }
]
