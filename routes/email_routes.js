const shortid = require('shortid')
const uuid = require('uuid')
const insertCommunicationsLog = require('../message_logs/dynamodb_api').insertCommunicationsLog
const generateInitialEmail = require('../api/ses_api').generateInitialEmail
const get_email_forwarding_relationship = require('./LeasingDB/Queries/EmailQueries').get_email_forwarding_relationship
const insert_email_relationship = require('./LeasingDB/Queries/EmailQueries').insert_email_relationship
const get_landlord_info = require('./PropertyDB/Queries/LandlordQuery').get_landlord_info
const generateTenantAliasEmail = require('../api/generate_alias_emails').generateTenantAliasEmail
const updateLandlordLastActive = require('../api/corporate_landlord_api').updateLandlordLastActive


exports.send_initial_email = (info) => {
  console.log('---------------- Initial Email Message ----------------')
  const p = new Promise((res, rej) => {
    const tenantId = info.tenant_id
    const tenantEmail = info.email
    const tenantFirstName = info.first_name
    const tenantLastName = info.last_name

    const message = info.group_notes
    const buildingId = info.building_id
    const buildingAddress = info.building_address
    const buildingAlias = info.building_alias

    let landlordObj
    let relationshipObj

    // MUST DO THE FOLLOWING

    // 1. Create a relationship/get the existing relationship between this tenant_email and landlord_email
        // a. get corporation object
        // b. insert relationship
    get_landlord_info(buildingId)
      .then((data) => {
        landlordObj = data
        return insert_email_relationship(
          tenantId,
          tenantEmail,
          generateTenantAliasEmail(tenantFirstName, tenantLastName),
          data.corporation_id,
          data.email,
          data.alias_email
        )
      })
      .then((relationship) => {
        console.log(relationship)
        relationshipObj = relationship
        // 2. Use AWS SES to send the initial message to each user with the the from email as the email alias (from: emailAlias@renthero.cc), which is essentially our proxyEmailAddress
        // first to the TENANT
        return generateInitialEmail(
          [relationshipObj.tenant_email],
          relationshipObj.landlord_alias_email,
          { first_name: tenantFirstName, last_name: tenantLastName },
          message,
          { building_id: buildingId, building_address: buildingAddress, building_alias: buildingAlias },
          'tenant'
        )
      })
      .then((data) => {
        // Save the message to Communications Log for TENANT
        insertCommunicationsLog({
          'ACTION': 'INITIAL_MESSAGE',
          'DATE': new Date().getTime(),
          'COMMUNICATION_ID': uuid.v4(),
          'MEDIUM': 'EMAIL',

          'TENANT_ID': tenantId,
          'TENANT_NAME': `${tenantFirstName} ${tenantLastName}`,
          'TENANT_EMAIL': tenantEmail,
          'LANDLORD_ID': landlordObj.corporation_id,
          'LANDLORD_NAME': landlordObj.corporation_name,
          'LANDLORD_EMAIL': landlordObj.email,

          'PROXY_CONTACT_ID': relationshipObj.landlord_alias_email,
          'SENDER_ID': landlordObj.corporation_id,
          'RECEIVER_ID': tenantId,
          'SENDER_CONTACT_ID': relationshipObj.landlord_alias_email,
          'RECEIVER_CONTACT_ID': relationshipObj.tenant_alias_email,

          'TEXT': message,
          'BUILDING_ID': buildingId,
          'BUILDING_ADDRESS': buildingAddress,
        })
        return generateInitialEmail(
          [relationshipObj.landlord_email],
          relationshipObj.tenant_alias_email,
          { first_name: tenantFirstName, last_name: tenantLastName },
          message,
          { building_id: buildingId, building_address: buildingAddress, building_alias: buildingAlias },
          'landlord'
        )
      })
      .then((data) => {
        // Save the message to Communications Log for TENANT
        insertCommunicationsLog({
          'ACTION': 'INITIAL_MESSAGE',
          'DATE': new Date().getTime(),
          'COMMUNICATION_ID': uuid.v4(),
          'MEDIUM': 'EMAIL',

          'TENANT_ID': tenantId,
          'TENANT_NAME': `${tenantFirstName} ${tenantLastName}`,
          'TENANT_EMAIL': tenantEmail,
          'LANDLORD_ID': landlordObj.corporation_id,
          'LANDLORD_NAME': landlordObj.corporation_name,
          'LANDLORD_EMAIL': landlordObj.email,

          'PROXY_CONTACT_ID': relationshipObj.tenant_alias_email,
          'SENDER_ID': tenantId,
          'RECEIVER_ID': landlordObj.corporation_id,
          'SENDER_CONTACT_ID': relationshipObj.tenant_alias_email,
          'RECEIVER_CONTACT_ID': relationshipObj.landlord_alias_email,

          'TEXT': message,
          'BUILDING_ID': buildingId,
          'BUILDING_ADDRESS': buildingAddress,
        })
        res(landlordObj)
      })
      .catch((err) => {
        console.log(err)
        rej(err)
      })
  })
  return p
}

exports.send_initial_corporate_email = (tenant, corporation, building, message, employee) => {
  console.log('---------------- Initial Email Message ----------------')
  const p = new Promise((res, rej) => {
    let relationshipObj

    // 1. Create a relationship/get the existing relationship between this tenant_email and landlord_email
        // a. get corporation object
        // b. insert relationship

    insert_email_relationship(
        tenant.tenant_id,
        tenant.email,
        generateTenantAliasEmail(tenant.first_name, tenant.last_name),
        employee.corporation_id,
        employee.email,
        employee.alias_email
    )
    .then((relationship) => {
      console.log(relationship)
      relationshipObj = relationship
      // 2. Use AWS SES to send the initial message to each user with the the from email as the email alias (from: emailAlias@renthero.cc), which is essentially our proxyEmailAddress
      // first to the TENANT
      return generateInitialEmail(
        [relationshipObj.tenant_email],
        relationshipObj.landlord_alias_email,
        { first_name: tenant.first_name, last_name: tenant.last_name },
        message,
        { building_id: building.building_id, building_address: building.building_address, building_alias: building.building_alias },
        'tenant'
      )
    })
    .then((data) => {
      // Save the message to Communications Log for TENANT
      insertCommunicationsLog({
        'ACTION': 'INITIAL_MESSAGE',
        'DATE': new Date().getTime(),
        'COMMUNICATION_ID': uuid.v4(),
        'MEDIUM': 'EMAIL',

        'TENANT_ID': tenant.tenant_id,
        'TENANT_NAME': `${tenant.first_name} ${tenant.last_name}`,
        'TENANT_EMAIL': tenant.email,
        'LANDLORD_ID': corporation.corporation_id,
        'LANDLORD_NAME': corporation.corporation_name,
        'LANDLORD_EMAIL': employee.email,

        'PROXY_CONTACT_ID': relationshipObj.landlord_alias_email,
        'SENDER_ID': corporation.corporation_id,
        'RECEIVER_ID': tenant.tenant_id,
        'SENDER_CONTACT_ID': relationshipObj.landlord_alias_email,
        'RECEIVER_CONTACT_ID': relationshipObj.tenant_alias_email,

        'TEXT': message,
        'BUILDING_ID': building.building_id,
        'BUILDING_ADDRESS': building.building_address,
        'EMPLOYEE_ID': employee.employee_id,
      })
      return generateInitialEmail(
        [relationshipObj.landlord_email],
        relationshipObj.tenant_alias_email,
        { first_name: tenant.first_name, last_name: tenant.last_name },
        message,
        { building_id: building.building_id, building_address: building.building_address, building_alias: building.building_alias },
        'landlord'
      )
    })
    .then((data) => {
      // Save the message to Communications Log for TENANT
      insertCommunicationsLog({
        'ACTION': 'INITIAL_MESSAGE',
        'DATE': new Date().getTime(),
        'COMMUNICATION_ID': uuid.v4(),
        'MEDIUM': 'EMAIL',

        'TENANT_ID': tenant.tenant_id,
        'TENANT_NAME': `${tenant.first_name} ${tenant.last_name}`,
        'TENANT_EMAIL': tenant.email,
        'LANDLORD_ID': corporation.corporation_id,
        'LANDLORD_NAME': corporation.corporation_name,
        'LANDLORD_EMAIL': employee.email,

        'PROXY_CONTACT_ID': relationshipObj.tenant_alias_email,
        'SENDER_ID': tenant.tenant_id,
        'RECEIVER_ID': corporation.corporation_id,
        'SENDER_CONTACT_ID': relationshipObj.tenant_alias_email,
        'RECEIVER_CONTACT_ID': relationshipObj.landlord_alias_email,

        'TEXT': message,
        'BUILDING_ID': building.building_id,
        'BUILDING_ADDRESS': building.building_address,
        'EMPLOYEE_ID': employee.employee_id,
      })
      res(employee)
    })
    .catch((err) => {
      console.log(err)
      rej(err)
    })
  })
  return p
}

// POST /email_relationship
exports.email_relationship = (req, res, next) => {
  console.log('email_relationship')
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
  return get_email_forwarding_relationship(sender_actual_email, receiver_alias_email)
            .then((data) => {
              if (data) {
                res.json(data)
              } else {
                res.json({})
              }
            })
            .catch((err) => {
              console.log(err)
              res.status(500).send(err)
            })
}


// POST /save_email_communications_log
exports.save_email_communications_log = (req, res, next) => {
  const proxyEmailAddress = req.body.proxy_email
  const sender_id = req.body.sender_id
  const receiver_id = req.body.receiver_id
  const sender_email = req.body.sender_email
  const receiver_email = req.body.receiver_email
  const message = req.body.message

  if (req.body.corporation_id === sender_id) {
    updateLandlordLastActive(req.body.corporation_id)
  }

  insertCommunicationsLog({
    'ACTION': 'FORWARDED_MESSAGE',
    'DATE': new Date().getTime(),
    'COMMUNICATION_ID': shortid.generate(),
    'MEDIUM': 'EMAIL',

    'TENANT_ID': req.body.tenant_id,
    // 'TENANT_NAME': `${tenant.first_name} ${tenant.last_name}`,
    'TENANT_EMAIL': req.body.tenant_email,
    'LANDLORD_ID': req.body.landlord_id,
    // 'LANDLORD_NAME': corporateEmployee.corporation_name,
    'LANDLORD_EMAIL': req.body.landlord_email,

    'PROXY_CONTACT_ID': proxyEmailAddress,
    'SENDER_ID': sender_id,
    'RECEIVER_ID': receiver_id,
    'SENDER_CONTACT_ID': sender_email,
    'RECEIVER_CONTACT_ID': receiver_email,
    'TEXT': message,
  }).then((data) => {
    console.log('======= EMAIL insertCommunicationsLog ========')
    console.log(data)
    res.json({
      message: 'Successfully saved'
    })
  }).catch((err) => {
    res.status(500).send({
      message: 'FAILED TO SAVE'
    })
  })
}
