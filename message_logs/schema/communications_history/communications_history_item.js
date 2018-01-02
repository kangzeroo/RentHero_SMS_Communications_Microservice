const COMMUNICATIONS_HISTORY = require('../dynamodb_tablenames').COMMUNICATIONS_HISTORY


// ====================================

exports.reference_items = [
  {
    'TableName': COMMUNICATIONS_HISTORY,
    'Item': {
      'ACTION': 'INITIAL_TOUR_REQUEST',
      'DATE': new Date().getTime(),
      'COMMUNICATION_ID': 'uuid.v4()',
      'MEDIUM': 'EMAIL || SMS',

      'TENANT_ID': `this.props.tenant_profile.id` || 'NONE',
      'TENANT_PHONE': '+134534536565',
      'TENANT_NAME': 'Steve Carrol',
      'LANDLORD_ID': '348tuoudfsljf',
      'LANDLORD_NAME': 'KW2Rent',
      'LANDLORD_PHONE': '+14556485767',

      'PROXY_CONTACT_ID': '983LIJSDFSDFLJ9',
      'SENDER_ID': 'SGF4534536565',
      'RECEIVER_ID': 'SDF4556485767',
      'SENDER_CONTACT_ID': 'us-east-asdsfl4394',
      'RECEIVER_CONTACT_ID': 'us-east-z243536536 but sent to both, so two records would occur',

      'TEXT': 'Hello I would like to book a tour for _______ on ______. Would this work?',
      'BUILDING_ID': '394dfhglf8348to',
      'BUILDING_ADDRESS': '330 King St North, Waterloo ON',
    }
  },
  {
    'TableName': COMMUNICATIONS_HISTORY,
    'Item': {
      'ACTION': 'INITIAL_MESSAGE',
      'DATE': new Date().getTime(),
      'COMMUNICATION_ID': 'uuid.v4()',
      'MEDIUM': 'EMAIL || SMS',

      'TENANT_ID': `this.props.tenant_profile.id` || 'NONE',
      'TENANT_NAME': 'Steve Carrol',
      'TENANT_PHONE': '+134534536565',
      'LANDLORD_ID': '348tuoudfsljf',
      'LANDLORD_NAME': 'KW2Rent',
      'LANDLORD_PHONE': '+14556485767',

      'PROXY_CONTACT_ID': '983LIJSDFSDFLJ9',
      'SENDER_ID': 'SGF4534536565',
      'RECEIVER_ID': 'SDF4556485767',
      'SENDER_CONTACT_ID': 'us-east-asdsfl4394',
      'RECEIVER_CONTACT_ID': 'us-east-z243536536 but sent to both, so two records would occur',

      'TEXT': 'Hello is this the landlord for XXXX?',
      'BUILDING_ID': '394dfhglf8348to',
      'BUILDING_ADDRESS': '330 King St North, Waterloo ON',
    }
  },
  {
    'TableName': COMMUNICATIONS_HISTORY,
    'Item': {
      'ACTION': 'FORWARDED_MESSAGE',
      'DATE': new Date().getTime(),
      'COMMUNICATION_ID': 'uuid.v4()',
      'MEDIUM': 'EMAIL || SMS',

      'PROXY_CONTACT_ID': '983LIJSDFSDFLJ9',
      'SENDER_ID': 'SGF4534536565',
      'RECEIVER_ID': 'SDF4556485767',
      'SENDER_CONTACT_ID': '+134534536565',
      'RECEIVER_CONTACT_ID': '+14556485767',

      'TEXT': 'Yes there is availability...',
    }
  },
  {
    'TableName': COMMUNICATIONS_HISTORY,
    'Item': {
      'ACTION': 'SENT_GROUP_INVITE',
      'DATE': new Date().getTime(),
      'COMMUNICATION_ID': 'uuid.v4()',
      'MEDIUM': 'SMS || EMAIL',

      'PROXY_CONTACT_ID': '983LIJSDFSDFLJ9',
      'SENDER_ID': `this.props.tenant_profile.id` || 'NONE',
      'RECEIVER_ID': '+14556485767',
      'SENDER_CONTACT_ID': '+134534536565',
      'RECEIVER_CONTACT_ID': '+14556485767',

      'TEXT': 'Yes there is availability...',
      'GROUP_ID': 'LSDJF45OFS456FD',
      'INVITATION_ID': 'LJSDFJLSKDFS3849',
    }
  },
  {
    'TableName': COMMUNICATIONS_HISTORY,
    'Item': {
      'ACTION': 'SENT_RECOMMENDATION',
      'DATE': new Date().getTime(),
      'COMMUNICATION_ID': 'uuid.v4()',
      'MEDIUM': 'SMS || EMAIL',

      'PROXY_CONTACT_ID': '983LIJSDFSDFLJ9',
      'SENDER_ID': `this.props.tenant_profile.id` || 'NONE',
      'RECEIVER_ID': '+14556485767',
      'SENDER_CONTACT_ID': '+134534536565',
      'RECEIVER_CONTACT_ID': '+14556485767',

      'TEXT': 'Hello Sarah, check out this link for recommendations',
      'RECOMMENDATION_DETAILS': '4 bed places with ensuite - 110 columbia with id...',
    }
  }
]
