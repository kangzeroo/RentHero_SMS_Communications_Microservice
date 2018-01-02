const ORCHESTRA_ACTIVITY = require('../dynamodb_tablenames').ORCHESTRA_ACTIVITY


// ====================================

exports.reference_items = [
  {
    'TableName': ORCHESTRA_ACTIVITY,
    'Item': {
      'ACTION': 'MAGIC_LINK_GROUP_SENT',
      'DATE': new Date().getTime(),
      'ORCHESTRA_ID': 'uuid.v4()',
      'MAGIC_LINK_ID': 'jolasf7iu8s8auf9asf',

      'TARGET_ID': 'tenant_id',
      'TARGET_CONTACT_ID': '+14556485767',
      'PROXY_CONTACT_ID': '983LIJSDFSDFLJ9',

      'SENDER_ID': `tenant_id`,
      'SENDER_CONTACT_ID': '+134534536565',
      'GROUP_ID': 'LSDJF45OFS456FD',
      'INVITATION_ID': 'LJSDFJLSKDFS3849',
      'FINGERPRINT': 'this.props.fingerprint',
    }
  },
  {
    'TableName': ORCHESTRA_ACTIVITY,
    'Item': {
      'ACTION': 'MAGIC_LINK_GROUP_PROGRESS',
      'DATE': new Date().getTime(),
      'ORCHESTRA_ID': 'uuid.v4()',
      'MAGIC_LINK_ID': 'jolasf7iu8s8auf9asf',

      'TARGET_ID': 'tenant_id',
      'TARGET_CONTACT_ID': '+14556485767',

      'STEP': 'OPENED, STEP1, STEP2, COMPLETED',
      'FINGERPRINT': 'this.props.fingerprint',
    },
  },
  {
    'TableName': ORCHESTRA_ACTIVITY,
    'Item': {
      'ACTION': 'MAGIC_LINK_RECOMMENDATION_SENT',
      'DATE': new Date().getTime(),
      'ORCHESTRA_ID': 'uuid.v4()',
      'MAGIC_LINK_ID': 'jolasf7iu8s8auf9asf',

      'TARGET_ID': 'tenant_id',
      'TARGET_CONTACT_ID': '+14556485767',
      'PROXY_CONTACT_ID': '983LIJSDFSDFLJ9',

      'SENDER_ID': `RENTHERO_ORCHESTRA`,
      'SENDER_CONTACT_ID': 'RENTHERO_ORCHESTRA',
      'LEAD_ID': 'asdfgd490jfjsdfsf',
      'FINGERPRINT': 'this.props.fingerprint',
    }
  },
  {
    'TableName': ORCHESTRA_ACTIVITY,
    'Item': {
      'ACTION': 'MAGIC_LINK_RECOMMENDATION_PROGRESS',
      'DATE': new Date().getTime(),
      'ORCHESTRA_ID': 'uuid.v4()',
      'MAGIC_LINK_ID': 'jolasf7iu8s8auf9asf',

      'TARGET_ID': 'tenant_id',
      'TARGET_CONTACT_ID': '+14556485767',

      'STEP': 'OPENED, STEP1, STEP2, COMPLETED',
      'FINGERPRINT': 'this.props.fingerprint',
    }
  },
  {
    'TableName': ORCHESTRA_ACTIVITY,
    'Item': {
      'ACTION': 'REFERRAL_LINK',
      'DATE': new Date().getTime(),
      'ORCHESTRA_ID': 'uuid.v4()',
      'MAGIC_LINK_ID': 'this.state.magicLinkData.referralCredit',

      'TARGET_ID': 'SHARED_LINK',
      'TARGET_CONTACT_ID': 'SHARED_LINK',

      'STEP': 'REFERRAL_OPENED',
      'FINGERPRINT': 'this.props.fingerprint',
    }
  }
]
