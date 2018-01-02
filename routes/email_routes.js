const shortid = require('shortid')
const insertCommunicationsLog = require('../message_logs/dynamodb_api').insertCommunicationsLog
const generateInitialEmail = require('../api/ses_api').generateInitialEmail

// POST /send_initial_email
exports.send_initial_email = (req, res, next) => {
  const tenantId = req.body.tenant_id
  const tenantEmail = req.body.tenant_email
  const corporationId = req.body.corporation_id
  const message = req.body.message
  const buildingId = req.body.building_id
  // MUST DO THE FOLLOWING

  // 1. Create a relationship between this tenant_email and landlord_email

  // 2. Query for the building, tenant and corporation based off the buildingId, tenantId, corporationId

  // 3. Assign an email alias to each email, if not already existing

  // 4. Use AWS SES to send the initial message to each user with the the from email as the email alias (from: emailAlias@renthero.cc), which is essentially our proxyEmailAddress
              // generateInitialEmail(toEmailAddresses = [landlord.corporation_email], proxyEmailAddress, tenant, message, building)
              /*
                toEmailAddresses = ['personA@email.com', 'personB@email.com']
                proxyEmailAddress = 'relationshipID@renthero.cc',
                tenant = { tenant_id: '89oOHDF9f', first_name: 'Mike' }
                message = 'Hello, Renthero has generated a lead for you...'
                building = { building_id, building_alias }
              */

  // 5. Save the message to Communications Log
              // leave this for Kangze
              // SAVE ONCE FOR TENANT's INITIAL EMAIL
              /*
                insertCommunicationsLog({
                  'ACTION': 'INITIAL_MESSAGE',
                  'DATE': new Date().getTime(),
                  'COMMUNICATION_ID': RelationshipID,
                  'MEDIUM': 'EMAIL',

                  'TENANT_ID': tenantId,
                  'TENANT_NAME': tenant.first_name,
                  'TENANT_EMAIL': tenantEmail,
                  'LANDLORD_ID': corporationId,
                  'LANDLORD_NAME': landlord.corporation_name,
                  'LANDLORD_EMAIL': landlord.corporation_email,

                  'PROXY_CONTACT_ID': proxyEmailAddress,
                  'SENDER_ID': tenantId,
                  'RECEIVER_ID': corporationId,
                  'SENDER_CONTACT_ID': tenantEmail,
                  'RECEIVER_CONTACT_ID': landlord.corporation_email,

                  'TEXT': message,
                  'BUILDING_ID': buildingId,
                  'BUILDING_ADDRESS': building.building_address,
                })
              */
              // SAVE ONCE FOR LANDLORD's INITIAL EMAIL
              /*
                insertCommunicationsLog({
                  'ACTION': 'INITIAL_MESSAGE',
                  'DATE': new Date().getTime(),
                  'COMMUNICATION_ID': RelationshipID,
                  'MEDIUM': 'EMAIL',

                  'TENANT_ID': tenantId,
                  'TENANT_NAME': tenant.first_name,
                  'TENANT_EMAIL': tenantEmail,
                  'LANDLORD_ID': corporationId,
                  'LANDLORD_NAME': landlord.corporation_name,
                  'LANDLORD_EMAIL': landlord.corporation_email,

                  'PROXY_CONTACT_ID': proxyEmailAddress,
                  'SENDER_ID': corporationId,
                  'RECEIVER_ID': tenantId,
                  'SENDER_CONTACT_ID': landlord.corporation_email,
                  'RECEIVER_CONTACT_ID': tenantEmail,

                  'TEXT': message,
                  'BUILDING_ID': buildingId,
                  'BUILDING_ADDRESS': building.building_address,
                })
              */
}

// POST /email_relationship
exports.email_relationship = (req, res, next) => {
  const receiver_alias_email = req.body.receiver_alias_email
  const sender_actual_email = req.body.sender_actual_email
  // MUST DO THE FOLLOWING
  // 1. return the below object based on the receiver_alias_email and sender_actual_email
  /*
        object = {
          tenant_email,
          landlord_email,
          tenant_id,
          landlord_id,
          tenant_alias_email,
          landlord_alias_email,
        }
  */
}


// POST /save_email_communications_log
exports.save_email_communications_log = (req, res, next) => {
  const proxyEmailAddress = req.body.proxy_email
  const sender_id = req.body.sender_id
  const receiver_id = req.body.receiver_id
  const sender_email = req.body.sender_email
  const receiver_email = req.body.receiver_email
  const message = req.body.message

  insertCommunicationsLog({
    'ACTION': 'FORWARDED_MESSAGE',
    'DATE': new Date().getTime(),
    'COMMUNICATION_ID': shortid.generate(),
    'MEDIUM': 'EMAIL',
    'PROXY_CONTACT_ID': proxyEmailAddress,
    'SENDER_ID': sender_id,
    'RECEIVER_ID': receiver_id,
    'SENDER_CONTACT_ID': sender_email,
    'RECEIVER_CONTACT_ID': receiver_email,
    'TEXT': message,
  })
}
