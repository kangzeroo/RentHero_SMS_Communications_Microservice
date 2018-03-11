const twilio_client = require('../twilio_setup').generate_twilio_client();
// const twiml_client = new require('../twilio_setup').generate_twiml_client()
const RENTHERO_SENDER_ID = require('../message_logs/schema/dynamodb_tablenames').RENTHERO_SENDER_ID
const uuid = require('uuid')
const shortid = require('shortid')

const MessagingResponse = require('twilio').twiml.MessagingResponse;
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const shortenUrl = require('../api/general_api').shortenUrl
const messagingServiceSid = process.env.MESSAGE_SERVICE_ID

const updateLandlordLastActive = require('../api/corporate_landlord_api').updateLandlordLastActive
const gatherOutgoingNumber = require('../api/sms_routing').gatherOutgoingNumber
const getLandlordInfo = require('./PropertyDB/Queries/LandlordQuery').get_landlord_info
const get_landlord_from_id = require('./PropertyDB/Queries/LandlordQuery').get_landlord_from_id
const insert_sms_match = require('./LeasingDB/Queries/SMSQueries').insert_sms_match
const update_sms_match = require('./LeasingDB/Queries/SMSQueries').update_sms_match
const get_tenant_landlord_match = require('./LeasingDB/Queries/SMSQueries').get_tenant_landlord_match
const get_tenant_landlord_sms_match = require('./LeasingDB/Queries/SMSQueries').get_tenant_landlord_sms_match
const get_tenant_landlord_twilio_numbers = require('./LeasingDB/Queries/SMSQueries').get_tenant_landlord_twilio_numbers

const generateInitialMessageBody_Tenant_ForExistingPair = require('../api/initial_message').generateInitialMessageBody_Tenant_ForExistingPair
const generateInitialMessageBody_Landlord_ForExistingPair = require('../api/initial_message').generateInitialMessageBody_Landlord_ForExistingPair

const generateInitialMessageBody_Tenant = require('../api/initial_message').generateInitialMessageBody_Tenant
const generateInitialMessageBody_Landlord = require('../api/initial_message').generateInitialMessageBody_Landlord

const insertCommunicationsLog = require('../message_logs/dynamodb_api').insertCommunicationsLog
const insertOrchestraLog = require('../message_logs/dynamodb_api').insertOrchestraLog

const verifiedPhoneNumber = require('../api/general_api').verifiedPhoneNumber
const generate_error_email = require('../api/error_api').generate_error_email

// for those initial sms messages
exports.send_initial_sms = function(info) {
  const p = new Promise((res, rej) => {
    console.log('---------------- Initial SMS Message ----------------')
    // console.log(info)
    let tenantId = info.tenant_id
    let tenantPhone = info.phone
    let landlordId
    let landlordPhone = ''
    let landlordName = ''
    let landlordTextable
    let totalServiceNumbers
    let serviceNumbers
    let twilioNumber

    // respond with twilio number if match already exists
    verifiedPhoneNumber(info.phone)
    .then((verifiedNumber) => {
      tenantPhone = verifiedNumber
      return getLandlordInfo(info.building_id)
    })
    .then((landlord_details) => {
      // console.log(landlord_details)
      landlordId = landlord_details.corporation_id
      landlordName = landlord_details.corporation_name
      landlordTextable = landlord_details.textable

      return verifiedPhoneNumber(landlord_details.phone)
    })
    .then((verifiedNumber) => {
      landlordPhone = verifiedNumber
      const service = twilio_client.messaging.services(messagingServiceSid)
      return service.phoneNumbers.list()
    })
    .then((data) => {
      // console.log('=========service.phoneNumbers.list(): ', data)
      serviceNumbers = data.map(s => s.phoneNumber)
      totalServiceNumbers = data.length
      return get_tenant_landlord_match(tenantPhone, landlordPhone)
    })
    .then((data) => {
      // console.log(data)
      if (data && data.twilio_phone) {
        console.log('MATCH ALREADY EXISTS')
        console.log('EXISTING TWILIO NUMBER: ', data.twilio_phone)
        // log that user and landlord mapping already exist. log(tenantPhone, [info.first_name, info.last_name].join(' '), landlordPhone, landlordName)
        twilioNumber = data.twilio_phone
        return sendInitialSMSForExistingTenantLandlordPair(
          info,
          { landlordId: landlordId, landlordName: landlordName, landlordPhone: landlordPhone, textable: landlordTextable, },
          { tenantId: tenantId, tenantPhone: tenantPhone },
          data.twilio_phone
        )
      } else {
        return get_tenant_landlord_twilio_numbers(tenantPhone, landlordPhone)
                  .then((data) => {
                    let dbtwilio_numbers
                    if (data && data.length > 0) {
                      dbtwilio_numbers = data.map(s => s.twilio_phone)
                    } else {
                      dbtwilio_numbers = []
                    }
                    if (dbtwilio_numbers.length >= totalServiceNumbers) {
                      console.log('BUY A NEW NUMBER')
                      return buyNewTwilioNumber()
                        .then((purchasedTwilioNumber) => {
                          console.log('PURCHASED TWILIO NUMBER: ', purchasedTwilioNumber)
                          twilioNumber = purchasedTwilioNumber
                          // log bought a new number: purchasedTwilioNumber for mapping tenantPhone and landlordPhone
                          return sendInitialSMSToTenantAndLandlord(
                            info,
                            { landlordId: landlordId, landlordName: landlordName, landlordPhone: landlordPhone, textable: landlordTextable, },
                            { tenantId: tenantId, tenantPhone: tenantPhone },
                            purchasedTwilioNumber
                          )
                        })
                    } else {
                      console.log('USE EXISTING NUMBER')
                      let selected_twilio_number
                      console.log(serviceNumbers)
                      if (dbtwilio_numbers && dbtwilio_numbers.length > 0 && serviceNumbers && serviceNumbers.length > 0) {
                        selected_twilio_number = serviceNumbers.filter(val => !dbtwilio_numbers.includes(val))[0]
                      } else {
                        selected_twilio_number = serviceNumbers[0]
                      }
                      console.log('SELECTED TWILIO NUMBER: ', selected_twilio_number)
                      twilioNumber = selected_twilio_number
                      return sendInitialSMSToTenantAndLandlord(
                        info,
                        { landlordId: landlordId, landlordName: landlordName, landlordPhone: landlordPhone, textable: landlordTextable, },
                        { tenantId: tenantId, tenantPhone: tenantPhone },
                        selected_twilio_number
                      )
                    }
                  })
      }
    })
    .then((data) => {
      res({
        message: 'Success',
        twilioNumber: twilioNumber,
      })
    })
    .catch((error) => {
      generate_error_email(JSON.stringify(error), 'send_initial_sms', `tenantID: ${tenantId}, tenantPhone: ${tenantPhone}, landlordId: ${landlordId}, landlordPhone: ${landlordPhone}, twilioNumber: ${twilioNumber}`)
      rej(error)
    })
  })
  return p
}


exports.send_initial_corporate_sms = function(tenant, corporation, building, group, employee) {
  const p = new Promise((res, rej) => {
    let totalServiceNumbers
    let serviceNumbers
    let twilioNumber

    let tenantPhone = tenant.phone
    let employeePhone = employee.phone

    const infoObj = {
      first_name: tenant.first_name,
      last_name: tenant.last_name,
      building_id: building.building_id,
      building_address: building.building_address,
      building_alias: building.building_alias,
      group_notes: group.group_notes,
      group_size: group.group_size,
      employee_id: employee.employee_id,
    }

    verifiedPhoneNumber(tenant.phone)
    .then((verifiedNumber) => {
      tenantPhone = verifiedNumber
      return verifiedPhoneNumber(employee.phone)
    })
    .then((verifiedNumber) => {
      employeePhone = verifiedNumber

      const service = twilio_client.messaging.services(messagingServiceSid)
      // First we gotta see all our twilio numbers
      return service.phoneNumbers.list()
    })
    .then((numbers) => {
      serviceNumbers = numbers.map(n => n.phoneNumber)
      totalServiceNumbers = numbers.length
      return get_tenant_landlord_match(tenantPhone, employeePhone)
    })
    .then((matchData) => {
      // Check if there is a match between the tenant phone and the employee phone

      if (matchData && matchData.twilio_phone) {
        // if there is a match, send an intitial message between the tenant and landlord pair
        console.log('MATCH ALREADY EXISTS', 'EXISTING TWILIO NUMBER: ', matchData.twilio_phone)
        twilioNumber = matchData.twilio_phone
        return sendInitialSMSForExistingTenantLandlordPair(
          infoObj,
          { landlordId: corporation.corporation_id, landlordName: corporation.corporation_name, landlordPhone: employeePhone },
          { tenantId: tenant.tenant_id, tenantPhone: tenantPhone },
          matchData.twilio_phone,
          employee
        )
      } else {
        // if there is not a match, get all twilio numbers that are either associated with the landlord or the tenant
        return get_tenant_landlord_twilio_numbers(tenantPhone, employeePhone)
        .then((twilioData) => {
          console.log('twilioData', twilioData)
          let dbtwilio_numbers
          if (twilioData && twilioData.length > 0) {
            dbtwilio_numbers = twilioData.map(s => s.twilio_phone)
          } else {
            dbtwilio_numbers = []
          }

          // if the number of associated twilio numbers are greater than the total serviceable numbers, then buy a new number
          if (dbtwilio_numbers.length >= totalServiceNumbers) {
            // greater, so lets buy a new twilio number
            console.log('BUY A NEW NUMBER')
            return buyNewTwilioNumber()
              .then((purchasedTwilioNumber) => {
                console.log('PURCHASED TWILIO NUMBER: ', purchasedTwilioNumber)
                twilioNumber = purchasedTwilioNumber
                return sendInitialSMSToTenantAndLandlord(
                  infoObj,
                  { landlordId: corporation.corporation_id, landlordName: corporation.corporation_name, landlordPhone: employeePhone, textable: true, },
                  { tenantId: tenant.tenant_id, tenantPhone: tenantPhone },
                  purchasedTwilioNumber
                )
              })
          } else {
            console.log('USE EXISTING NUMBER')
            let selected_twilio_number
            if (dbtwilio_numbers && dbtwilio_numbers.length > 0 && serviceNumbers && serviceNumbers.length > 0) {
              selected_twilio_number = serviceNumbers.filter(val => !dbtwilio_numbers.includes(val))[0]
            } else {
              selected_twilio_number = serviceNumbers[0]
            }
            console.log('SELECTED TWILIO NUMBER: ', selected_twilio_number)
            twilioNumber = selected_twilio_number
            return sendInitialSMSToTenantAndLandlord(
              infoObj,
              { landlordId: corporation.corporation_id, landlordName: corporation.corporation_name, landlordPhone: employeePhone, textable: true, },
              { tenantId: tenant.tenant_id, tenantPhone: tenantPhone },
              selected_twilio_number
            )
          }
        })
      }
    })
    .then((data) => {
      res({
        message: 'Success',
        twilioNumber: twilioNumber,
      })
    })
    .catch((error) => {
      console.log(error)
      generate_error_email(JSON.stringify(error), 'send_initial_corporate_sms', `tenantID: ${tenant.tenant_id}, tenantPhone: ${tenantPhone}, corporationID: ${corporation.corporation_id}, employeeID: ${employee.employee_id}, employeePhone: ${employeePhone}, twilioNumber: ${twilioNumber}`)
      rej(error)
    })
  })
  return p
}

const sendInitialSMSForExistingTenantLandlordPair = (info, landlord, tenant, twilioPhone) => {
  const id1 = shortid.generate()
  const id2 = shortid.generate()
  return generateInitialMessageBody_Tenant_ForExistingPair(info, landlord, id1)
    .then((tenantBody) => {
      // step 3B: send initial message to tenant
      insertCommunicationsLog({
        'ACTION': 'INITIAL_MESSAGE',
        'DATE': new Date().getTime(),
        'COMMUNICATION_ID': id1,
        'MEDIUM': 'SMS',

        'TENANT_ID': tenant.tenantId,
        'TENANT_NAME': info.first_name,
        'TENANT_PHONE': tenant.tenantPhone,
        'LANDLORD_ID': landlord.landlordId,
        'LANDLORD_NAME': landlord.landlordName,
        'LANDLORD_PHONE': landlord.landlordPhone,

        'PROXY_CONTACT_ID': twilioPhone,
        'SENDER_ID': landlord.landlordId,
        'RECEIVER_ID': tenant.tenantId,
        'SENDER_CONTACT_ID': landlord.landlordPhone,
        'RECEIVER_CONTACT_ID': tenant.tenantPhone,

        'TEXT': tenantBody,
        'BUILDING_ID': info.building_id,
        'BUILDING_ADDRESS': info.building_address,
        'EMPLOYEE_ID': info.employee_id || 'NONE',
      })
      return twilio_client.messages.create({
        body: tenantBody,
        to: tenant.tenantPhone,
        from: twilioPhone,
        // messagingServiceSid: messagingServiceSid // From a valid Twilio number
      })

      // log message sent to tenant
    })
    .then((message) => {
      return insert_sms_match(tenant.tenantId, tenant.tenantPhone, landlord.landlordId, landlord.landlordPhone, message.sid, twilioPhone)
    })
    .then(() => {
      // generate initial message to landlord
      return generateInitialMessageBody_Landlord_ForExistingPair(info, landlord, id2)
    })
    .then((landlordBody) => {
      // send initial message to landlord
      insertCommunicationsLog({
        'ACTION': 'INITIAL_MESSAGE',
        'DATE': new Date().getTime(),
        'COMMUNICATION_ID': id2,
        'MEDIUM': 'SMS',

        'TENANT_ID': tenant.tenantId,
        'TENANT_NAME': info.first_name,
        'TENANT_PHONE': tenant.tenantPhone,
        'LANDLORD_ID': landlord.landlordId,
        'LANDLORD_NAME': landlord.landlordName,
        'LANDLORD_PHONE': landlord.landlordPhone,

        'PROXY_CONTACT_ID': twilioPhone,
        'SENDER_ID': tenant.tenantId,
        'RECEIVER_ID': landlord.landlordId,
        'SENDER_CONTACT_ID': tenant.tenantPhone,
        'RECEIVER_CONTACT_ID': landlord.landlordPhone,

        'TEXT': landlordBody,
        'BUILDING_ID': info.building_id,
        'BUILDING_ADDRESS': info.building_address,
        'EMPLOYEE_ID': info.employee_id || 'NONE',
      })
      return twilio_client.messages.create({
        body: landlordBody,
        to: landlord.landlordPhone,
        from: twilioPhone,
        // messagingServiceSid: messagingServiceSid // From a valid Twilio number
      })

      // log message sent to landlord
    })
    .then((message) => {
      // step 5: done, twilio will handle the rest of the messages
      //console.log(message)
      console.log('MESSAGE SENT TO TENANT AND LANDLORD')
      return Promise.resolve()
    }).catch((err) => {
      console.log('ERROR OCCURRED')
      console.log(err)
    })
}

const sendInitialSMSToTenantAndLandlord = (info, landlord, tenant, twilioPhone) => {
  const id1 = shortid.generate()
  const id2 = shortid.generate()
  generateInitialMessageBody_Tenant(info, landlord, id1)
  .then((tenantBody) => {
    // step 3B: send initial message to tenant
    insertCommunicationsLog({
      'ACTION': 'INITIAL_MESSAGE',
      'DATE': new Date().getTime(),
      'COMMUNICATION_ID': id1,
      'MEDIUM': 'SMS',

      'TENANT_ID': tenant.tenantId,
      'TENANT_NAME': info.first_name,
      'TENANT_PHONE': tenant.tenantPhone,
      'LANDLORD_ID': landlord.landlordId,
      'LANDLORD_NAME': landlord.landlordName,
      'LANDLORD_PHONE': landlord.landlordPhone,

      'PROXY_CONTACT_ID': twilioPhone,
      'SENDER_ID': landlord.landlordId,
      'RECEIVER_ID': tenant.tenantId,
      'SENDER_CONTACT_ID': landlord.landlordPhone,
      'RECEIVER_CONTACT_ID': tenant.tenantPhone,

      'TEXT': tenantBody,
      'BUILDING_ID': info.building_id,
      'BUILDING_ADDRESS': info.building_address,
      'EMPLOYEE_ID': info.employee_id || 'NONE',
    })
    return twilio_client.messages.create({
      body: tenantBody,
      to: tenant.tenantPhone,
      from: twilioPhone,
      // messagingServiceSid: messagingServiceSid // From a valid Twilio number
    })

    // log message sent to tenant
  })
  .then((message) => {
    return insert_sms_match(tenant.tenantId, tenant.tenantPhone, landlord.landlordId, landlord.landlordPhone, message.sid, twilioPhone)
  })
  .then(() => {
    // generate initial message to landlord
    return generateInitialMessageBody_Landlord(info, landlord, id2)
  })
  .then((landlordBody) => {
    // send initial message to landlord
    insertCommunicationsLog({
      'ACTION': 'INITIAL_MESSAGE',
      'DATE': new Date().getTime(),
      'COMMUNICATION_ID': id2,
      'MEDIUM': 'SMS',

      'TENANT_ID': tenant.tenantId,
      'TENANT_NAME': info.first_name,
      'TENANT_PHONE': tenant.tenantPhone,
      'LANDLORD_ID': landlord.landlordId,
      'LANDLORD_NAME': landlord.landlordName,
      'LANDLORD_PHONE': landlord.landlordPhone,

      'PROXY_CONTACT_ID': twilioPhone,
      'SENDER_ID': tenant.tenantId,
      'RECEIVER_ID': landlord.landlordId,
      'SENDER_CONTACT_ID': tenant.tenantPhone,
      'RECEIVER_CONTACT_ID': landlord.landlordPhone,

      'TEXT': landlordBody,
      'BUILDING_ID': info.building_id,
      'BUILDING_ADDRESS': info.building_address,
      'EMPLOYEE_ID': info.employee_id || 'NONE',
    })
    return twilio_client.messages.create({
      body: landlordBody,
      to: landlord.landlordPhone,
      from: twilioPhone,
      // messagingServiceSid: messagingServiceSid // From a valid Twilio number
    })

    // log message sent to landlord
  })
  .then((message) => {
    // step 5: done, twilio will handle the rest of the messages
    //console.log(message)
    console.log('MESSAGE SENT TO TENANT AND LANDLORD')
  }).catch((err) => {
    console.log('ERROR OCCURRED')
    console.log(err)
  })
}

const buyNewTwilioNumber = () => {
  let purchasedTwilioNumber
  return twilio_client.availablePhoneNumbers('CA').local
  .list({
    inRegion: 'ON',
    smsEnabled: true,
    mmsEnabled: true,
    voiceEnabled: true,
  })
  .then((data) => {
    const number = data[0]
    purchasedTwilioNumber = number.phoneNumber
    return twilio_client.incomingPhoneNumbers.create({
      phoneNumber: number.phoneNumber,
      voiceUrl: 'https://rentburrow.com:3006/use-voice',
    })
  })
  .then((purchasedNumber) => {
    const service = twilio_client.messaging.services(messagingServiceSid)
    return service.phoneNumbers.create({
      phoneNumberSid: purchasedNumber.sid,
    })
  })
  .then((data) => {
    return purchasedTwilioNumber
  })
  .catch((err) => {
    console.log('Error', err)
  })
}

// POST /sms
exports.sms_forwarder = function(req, res, next) {
  console.log('/sms_forwarder')
  const twiml_client = new MessagingResponse();

  let original_from = req.body.From
  let twilio_to   = req.body.To
  let body = req.body.Body
  let original_to = ''

  console.log(original_from, twilio_to)

   gatherOutgoingNumber(original_from, twilio_to)
    .then((outgoingPhoneNumber) => {
      console.log('outgoingPhoneNumber: ', outgoingPhoneNumber)
      console.log('messaging...')
      original_to = outgoingPhoneNumber
      return get_tenant_landlord_sms_match(original_from, outgoingPhoneNumber)
    })
    .then((data) => {
      console.log(data)
      const sender_id = getAppropriateId(data, original_from)
      const receiver_id = getAppropriateId(data, original_to)

      if (data.corporation_id === sender_id) {
        updateLandlordLastActive(data.corporation_id)
      }
      // log from, to, body, outgoingPhoneNumber
      get_landlord_from_id(data.landlord_id)
      .then((landlordData) => {
        insertCommunicationsLog({
          'ACTION': 'FORWARDED_MESSAGE',
          'DATE': new Date().getTime(),
          'COMMUNICATION_ID': shortid.generate(),
          'PROXY_CONTACT_ID': twilio_to,
          'SENDER_ID': sender_id,
          'RECEIVER_ID': receiver_id,
          'SENDER_CONTACT_ID': original_from,
          'RECEIVER_CONTACT_ID': original_to,
          'TEXT': body,
          'MEDIUM': 'SMS',
          'TENANT_ID': data.tenant_id,
          'TENANT_NAME': [data.first_name, data.last_name].join(' ') || '',
          'TENANT_PHONE': data.tenant_phone || '',
          'LANDLORD_ID': landlordData && landlordData.corporation_id ? landlordData.corporation_id : '',
          'LANDLORD_NAME': landlordData && landlordData.corporation_name ? landlordData.corporation_name : '',
          'LANDLORD_PHONE': landlordData.employee_phone || landlordData.phone,
          'EMPLOYEE_ID': landlordData.employee_id || 'NONE',
        })
      })

      console.log({
        to: original_to,
      })
      twiml_client.message({
        to: original_to,
      }, body)
      console.log(twiml_client.toString())
      console.log('========>>>>>>>>>>>>>>>>>>>')
      res.type('text/xml');
      res.send(twiml_client.toString())
    })

  const getAppropriateId = (sms_mapping_row, phone) => {
    if (sms_mapping_row.tenant_phone === phone) {
      return sms_mapping_row.tenant_id
    } else if (sms_mapping_row.landlord_phone === phone) {
      return sms_mapping_row.landlord_id
    }
  }
}


exports.listener = function(req, res, next ) {
  const info = req.body

  const phone = info.From
  const sid = info.SmsSid

  console.log(phone, sid)

  // update_sms_match(phone, sid)
}

// POST /fallback
exports.fallback = function(req, res, next) {
  console.log('FALLBACK')
  console.log(req.body)
}
