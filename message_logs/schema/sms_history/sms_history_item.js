const SMS_HISTORY = require('../dynamodb_tablenames').SMS_HISTORY


// ====================================

exports.reference_items = [
  {
    'TableName': SMS_HISTORY,
    'Item': {
      'ACTION': 'INITIAL_TOUR_REQUEST',
      'DATE': new Date().getTime(),
      'TENANT_ID': `this.props.tenant_profile.id` || 'NONE',
      'TENANT_PHONE': '+134534536565',
      'LANDLORD_PHONE': '+14556485767',
      'SENDER_PHONE': 'Rentburrow',
      'RECEIVER_PHONE': '+14556485767 but sent to both, so two records would occur',
      'TEXT': 'Hello I would like to book a tour for _______ on ______. Would this work?',
      'BUILDING_ID': '394dfhglf8348to',
      'LANDLORD_ID': '348tuoudfsljf',
      'BUILDING_ADDRESS': '330 King St North, Waterloo ON',
    }
  },
  {
    'TableName': SMS_HISTORY,
    'Item': {
      'ACTION': 'INITIAL_MESSAGE',
      'DATE': new Date().getTime(),
      'TENANT_ID': `this.props.tenant_profile.id` || 'NONE',
      'TENANT_PHONE': '+134534536565',
      'LANDLORD_PHONE': '+14556485767',
      'SENDER_PHONE': 'Rentburrow',
      'RECEIVER_PHONE': '+14556485767 but sent to both, so two records would occur',
      'TEXT': 'Hello is this the landlord for XXXX?',
      'BUILDING_ID': '394dfhglf8348to',
      'LANDLORD_ID': '348tuoudfsljf',
      'BUILDING_ADDRESS': '330 King St North, Waterloo ON',
    }
  },
  {
    // When a user changes their rent_type filter to 'sublet' or 'lease', in <FilterBar> of Tenant_Website
    'TableName': SMS_HISTORY,
    'Item': {
      'ACTION': 'SMS_MESSAGE',
      'DATE': new Date().getTime(),
      'TENANT_ID': `this.props.tenant_profile.id` || 'NONE',
      'TENANT_PHONE': '+134534536565',
      'LANDLORD_PHONE': '+14556485767',
      'SENDER_PHONE': '+134534536565',
      'RECEIVER_PHONE': '+14556485767',
      'TEXT': 'Yes there is availability...',
      'BUILDING_ID': '394dfhglf8348to',
      'LANDLORD_ID': '348tuoudfsljf',
      'BUILDING_ADDRESS': '330 King St North, Waterloo ON',
    }
  },
]
