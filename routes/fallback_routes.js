const twilio_client = require('../twilio_setup').generate_twilio_client()

const MessagingResponse = require('twilio').twiml.MessagingResponse
const messagingServiceSid = process.env.MESSAGE_SERVICE_ID


const RENTHERO_SENDER_ID = require('../message_logs/schema/dynamodb_tablenames').RENTHERO_SENDER_ID
const uuid = require('uuid')
const shortid = require('shortid')

const stringSimilarity = require('string-similarity')
const get_all_building_addresses = require('./PropertyDB/Queries/BuildingQuery').get_all_building_addresses
const get_all_buildings_from_landlord_ids = require('./PropertyDB/Queries/BuildingQuery').get_all_buildings_from_landlord_ids

const get_tenant_landlord_match = require('./LeasingDB/Queries/SMSQueries').get_tenant_landlord_match
const get_tenant_landlord_sms_match = require('./LeasingDB/Queries/SMSQueries').get_tenant_landlord_sms_match
const get_tenant_landlord_twilio_numbers = require('./LeasingDB/Queries/SMSQueries').get_tenant_landlord_twilio_numbers
const insert_sms_match = require('./LeasingDB/Queries/SMSQueries').insert_sms_match

const get_landlord_from_twilio_phone = require('./LeasingDB/Queries/SMSQueries').get_landlord_from_twilio_phone

const get_landlord_info = require('./PropertyDB/Queries/LandlordQuery').get_landlord_info
const get_employee_assigned_to_building = require('./PropertyDB/Queries/LandlordQuery').get_employee_assigned_to_building

const formattedPhoneNumber = require('../api/general_api').formattedPhoneNumber

const insertCommunicationsLog = require('../message_logs/dynamodb_api').insertCommunicationsLog



exports.stranger_message = function(req, res, next) {
  console.log(req.body)
  console.log('====FallBack====')
  const info = req.body
  const from = info.From
  const to = info.To // twilio number
  const message = info.Body.toLowerCase()
  let building_id
  let selectedBuilding
  let allBuildingData

  insertCommunicationsLog({
    'ACTION': 'RENTHERO_FALLBACK',
    'DATE': new Date().getTime(),
    'COMMUNICATION_ID': shortid.generate(),

    'SENDER_ID': from,
    'SENDER_CONTACT_ID': from,
    'RECEIVER_CONTACT_ID': to,
    'RECEIVER_ID': to,
    'PROXY_CONTACT_ID': 'RENTHERO_FALLBACK',
  })

  console.log(to, message)

  get_all_building_addresses()
  .then((allBuildingData) => {
    const allTwilioBuildings = allBuildingData.map(s => s.building_address).concat(allBuildingData.map(x => x.building_alias))
    const matches = stringSimilarity.findBestMatch(message, allTwilioBuildings)
    if (matches.bestMatch.rating > 0.5) {
      console.log('stranger_message --> Rating: ', matches.bestMatch.rating)
      console.log('Message: ', message)
      console.log('Match: ', matches.bestMatch.target)
      // if there is a best match, find the right person to connect to
      get_landlord_from_twilio_phone(to)
      .then((landlordData) => {
        if (landlordData && landlordData.length > 0) {
          const landlord_ids = landlordData.map(s => s.landlord_id)
          get_all_buildings_from_landlord_ids(landlord_ids)
          .then((buildingData) => {
            const twilioBuildings = buildingData.map(s => s.building_address).concat(buildingData.map(x => x.building_alias))
            const determinedBuilding = compare_message_to_buildings(message, twilioBuildings)
            selectedBuilding = buildingData.filter((bd) => {
              return bd.building_alias.toLowerCase() === determinedBuilding.toLowerCase() || bd.building_address.toLowerCase() === determinedBuilding.toLowerCase()
            })[0].building_id
            building_id = selectedBuilding.building_id
            console.log(building_id, selectedBuilding.building_id)
            return get_employee_assigned_to_building(selectedBuilding.building_id)
          })
          .then((employeeData) => {
             console.log('LINE 65: ', employeeData)
             if (employeeData) {
               console.log('LINE 67: ', employeeData)
               // call initial on the tenant and employee using the employee number
               get_landlord_info(building_id)
               .then((lData) => {
                 const message = `Hello, this is ${employeeData.first_name}, I'm a representative of ${lData.corporation_name}.
                                  Please text or call me regarding your interest in ${selectedBuilding.building_alias}
                                  `
                 return send_initial(from, formattedPhoneNumber(employeeData.phone), message, building_id)
               })
             } else {
               get_landlord_info(building_id)
               .then((landlordData) => {
                 console.log('LINE 73: ', landlordData)
                 // call initial on the tenant and employee using the corporation phone number
                 const message = `Hello, this is ${landlordData.corporation_name},
                                  Please text or call me regarding your interest in ${selectedBuilding.building_alias}.
                                  `
                 return send_initial(from, formattedPhoneNumber(landlordData.phone), message, building_id)
               })
             }
          })
        } else {
          const determinedBuilding = compare_message_to_buildings(message, allTwilioBuildings)
          console.log(allBuildingData)
          const selectedBuilding = allBuildingData.filter((bd) => {
            return bd.building_alias.toLowerCase() === determinedBuilding.toLowerCase() || bd.building_address.toLowerCase() === determinedBuilding.toLowerCase()
          })[0].building_id
          building_id = selectedBuilding.building_id
          console.log(selectedBuilding.building_id)
          get_employee_assigned_to_building(selectedBuilding.building_id)
          .then((employeeData) => {
            console.log('LINE 87: ', employeeData)
            if (employeeData) {
              console.log('LINE 89: ', employeeData)
              // call initial on the tenant and employee using the employee number
              get_landlord_info(building_id)
              .then((lData) => {
                const message = `Hello, this is ${employeeData.first_name}, I'm a representative of ${lData.corporation_name}.
                                 Please text or call me regarding your interest in ${selectedBuilding.building_alias}
                                 `
                return send_initial(from, formattedPhoneNumber(employeeData.phone), message, building_id)
              })
            } else {
              console.log(building_id)
              get_landlord_info(building_id)
              .then((landlordData) => {
                console.log('LINE 95: ', landlordData)
                // call initial on the tenant and employee using the corporation phone number
                const message = `Hello, this is ${landlordData.corporation_name},
                                 Please text or call me regarding your interest in ${selectedBuilding.building_alias}.
                                 `
                return send_initial(from, formattedPhoneNumber(landlordData.phone), message, building_id)
              })
            }
          })
        }
      })
    } else {
      console.log('stranger_message <-- Rating: ', matches.bestMatch.rating)
      console.log('Message: ', message)
      console.log('Best Match: ', matches.bestMatch.target)
      // assume the tenant hasn't said anything, send a message to prompt the tenant to type in the building name
      console.log('PROMPT the user to type a building')
      // const twilio_client = new MessagingResponse()
      insertCommunicationsLog({
        'ACTION': 'RENTHERO_FALLBACK',
        'DATE': new Date().getTime(),
        'COMMUNICATION_ID': shortid.generate(),

        'SENDER_ID': 'RENTHERO_FALLBACK',
        'SENDER_CONTACT_ID': 'RENTHERO_FALLBACK',
        'RECEIVER_CONTACT_ID': from,
        'RECEIVER_ID': from,
        'PROXY_CONTACT_ID': 'RENTHERO_FALLBACK',
        'TEXT': 'Please enter the building name',
      })
      twilio_client.messages.create({
        to: from,
        from: to,
        body: 'Please type the building name',
      })
      res.type('text/xml')
      res.send(twilio_client.toString())
    }
  })
}

const send_initial = (tenantPhone, landlordPhone, message, building_id) => {
  const twilioNumber = determine_new_twilio_number(tenantPhone, landlordPhone)
  // const twilio_client = new MessagingResponse()
  insertCommunicationsLog({
    'ACTION': 'RENTHERO_FALLBACK',
    'DATE': new Date().getTime(),
    'COMMUNICATION_ID': shortid.generate(),

    'SENDER_ID': 'RENTHERO_FALLBACK',
    'SENDER_CONTACT_ID': 'RENTHERO_FALLBACK',
    'RECEIVER_CONTACT_ID': tenantPhone,
    'RECEIVER_ID': tenantPhone,
    'PROXY_CONTACT_ID': twilioNumber,
    'TEXT': message,
    'BUILDING_ID': building_id,
  })
  // insert_sms_match(null, tenantPhone, null, landlordPhone, twilioNumber)
  twilio_client.messages.create({
    to: tenantPhone,
    from: twilioNumber,
    body: message,
  })
  .then((data) => {
    console.log(data)
  })
  // res.type('text/xml')
  // res.send(twilio_client.toString())
}


const determine_new_twilio_number = (tenantPhone, landlordPhone) => {
  let serviceNumbers
  let totalServiceNumbers

  const service = twilio_client.messaging.services(messagingServiceSid)
  service.phoneNumbers.list()
  .then((data) => {
    serviceNumbers = data.map(s => s.phoneNumber)
    totalServiceNumbers = data.length
    return get_tenant_landlord_match(tenantPhone, landlordPhone)
  })
  .then((data) => {
    if (data && data.twilio_phone) {
      console.log('MATCH ALREADY EXISTS! USE EXISTING TWILIO #: ', data.twilio_phone)

      // twilioNumber = data.twilio_phone
      return data.twilio_phone
    } else {
      return get_tenant_landlord_twilio_numbers(tenantPhone, landlordPhone)
      .then((dbData) => {
        let dbtwilio_numbers
        if (dbData && dbData.length > 0) {
          dbtwilio_numbers = dbData.map(s => s.twilio_phone)
        } else {
          dbtwilio_numbers = []
        }
        if (dbtwilio_numbers.length >= totalServiceNumbers) {
          console.log('BUY A NEW NUMBER')
          return buyNewTwilioNumber()
          .then((purchasedTwilioNumber) => {
            console.log('PURCHASED TWILIO NUMBER: ', purchasedTwilioNumber)
            return purchasedTwilioNumber
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
          return selected_twilio_number
        }
      })
    }
  })
}

const compare_message_to_buildings = (message, twilioBuildings) => {
  const filteredBuildings = twilioBuildings.filter((building) => {
    return message.indexOf(building.toLowerCase()) >= 0
  })

  if (filteredBuildings.length > 0) {
    return filteredBuildings[0]
  } else {
    const matches = stringSimilarity.findBestMatch(message, twilioBuildings)
    return matches.bestMatch.target
  }
}

const buyNewTwilioNumber = () => {
  let purchasedTwilioNumber
  return twilio_client.availablePhoneNumbers('CA').local
  .list({
    areaCode: '519',
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
