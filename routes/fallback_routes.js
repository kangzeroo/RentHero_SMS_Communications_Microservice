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
const get_employee_assigned_to_building = require('./PropertyDB/Queries/LandlordQuery').get_employee_assigned_to_building

const get_landlord_from_twilio_phone = require('./LeasingDB/Queries/SMSQueries').get_landlord_from_twilio_phone

const get_landlord_info = require('./PropertyDB/Queries/LandlordQuery').get_landlord_info
const get_employee_assigned_to_building = require('./PropertyDB/Queries/LandlordQuery').get_employee_assigned_to_building

const formattedPhoneNumber = require('../api/general_api').formattedPhoneNumber

const insertCommunicationsLog = require('../message_logs/dynamodb_api').insertCommunicationsLog

const determine_new_twilio_number = require('../api/select_number_api').determine_new_twilio_number


exports.stranger_message = function(req, res, next) {
  console.log('stranger_message: ====FALLBACK=====')
  const info = req.body
  const from = info.From
  const to = info.To // twilio number
  const message = info.Body.toLowerCase()
  let allBuildingData

  insertCommunicationsLog({
    'ACTION': 'RENTHERO_SMS_FALLBACK',
    'DATE': new Date().getTime(),
    'COMMUNICATION_ID': shortid.generate(),
    'MEDIUM': 'SMS',

    'SENDER_ID': from,
    'SENDER_CONTACT_ID': from,
    'RECEIVER_CONTACT_ID': 'invalid',
    'RECEIVER_ID': 'invalid',
    'PROXY_CONTACT_ID': to,
    'TEXT': message,
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

      const twilioBuildings = allBuildingData.map(s => s.building_address).concat(allBuildingData.map(x => x.building_alias))
      const determinedBuilding = compare_message_to_buildings(message, twilioBuildings)
      console.log(determinedBuilding)
      const selectedBuilding = allBuildingData.filter((bd) => {
        return bd.building_alias.toLowerCase() === determinedBuilding.toLowerCase() || bd.building_address.toLowerCase() === determinedBuilding.toLowerCase()
      })[0]
      const building_id = selectedBuilding.building_id

      console.log(building_id, selectedBuilding.building_id)

      return get_landlord_info(building_id)
      .then((landlordData) => {
        if (landlordData.corporate_landlord) {
          if (landlordData.random_assign) {
            console.log('====RANDOMIZED ASSIGNMENT=====')
            get_all_employees_from_corporation(landlordData.corporation_id)
            .then((employeesData) => {
              const selectedEmployee = employeesData[Math.floor(Math.random() * employeesData.length)]
              console.log('selected employee: ', selectedEmployee)

              const message = `Hello, this is ${selectedEmployee.first_name}, I'm a representative of ${landlordData.corporation_name}.
                               Please text or call me regarding your interest in ${selectedBuilding.building_alias}
                               `
              return send_initial(from, formattedPhoneNumber(selectedEmployee.phone), message, building_id)
            })
          } else {
            console.log('====BUILDING ASSIGNMENT======')
            get_employee_assigned_to_building(selectedBuilding.building_id)
            .then((employeeData) => {
              console.log('employee data: ', employeeData)
              const message = `Hello, this is ${employeeData.first_name}, I'm a representative of ${landlordData.corporation_name}.
                               Please text or call me regarding your interest in ${selectedBuilding.building_alias}
                               `
              return send_initial(from, formattedPhoneNumber(employeeData.phone), message, building_id)
            })
          }
        } else {
          const message = `Hello, this is ${landlordData.corporation_name},
                           Please text or call me regarding your interest in ${selectedBuilding.building_alias}.
                           `
          return send_initial(from, formattedPhoneNumber(landlordData.phone), message, building_id)
        }
      })


      // return get_employee_assigned_to_building(selectedBuilding.building_id)
      // .then((employeeData) => {
      //   console.log('employee data: ', employeeData)
      //
      //   if (employeeData) {
      //     get_landlord_info(building_id)
      //     .then((lData) => {
      //       const message = `Hello, this is ${employeeData.first_name}, I'm a representative of ${lData.corporation_name}.
      //                        Please text or call me regarding your interest in ${selectedBuilding.building_alias}
      //                        `
      //       return send_initial(from, formattedPhoneNumber(employeeData.phone), message, building_id)
      //     })
      //   } else {
      //     get_landlord_info(building_id)
      //     .then((landlordData) => {
      //       console.log('LINE 73: ', landlordData)
      //       // call initial on the tenant and employee using the corporation phone number
      //       const message = `Hello, this is ${landlordData.corporation_name},
      //                        Please text or call me regarding your interest in ${selectedBuilding.building_alias}.
      //                        `
      //       return send_initial(from, formattedPhoneNumber(landlordData.phone), message, building_id)
      //     })
      //   }
      // })

    } else {
      console.log('stranger_message <-- Rating: ', matches.bestMatch.rating)
      // console.log('Message: ', message)
      console.log('Best Match: ', matches.bestMatch.target)
      // assume the tenant hasn't said anything, send a message to prompt the tenant to type in the building name
      console.log('PROMPT the user to type a building')
      // const twilio_client = new MessagingResponse()

      const message_id = shortid.generate()
      const message = `Hello, please respond to this message with a property name, and we will connect you with the landlord. Cheers! [ RENTHERO TERMS OF USE: RentHero.cc/m/${message_id} ]`
      insertCommunicationsLog({
        'ACTION': 'RENTHERO_SMS_FALLBACK',
        'DATE': new Date().getTime(),
        'COMMUNICATION_ID': message_id,
        'MEDIUM': 'SMS',

        'SENDER_ID': 'RENTHERO_SMS_FALLBACK',
        'SENDER_CONTACT_ID': 'RENTHERO_SMS_FALLBACK',
        'RECEIVER_CONTACT_ID': from,
        'RECEIVER_ID': from,
        'PROXY_CONTACT_ID': 'RENTHERO_SMS_FALLBACK',
        'TEXT': message,
      })
      twilio_client.messages.create({
        to: from,
        from: to,
        body: message,
      })
      res.type('text/xml')
      res.send(twilio_client.toString())
    }
  })
}

const send_initial = (tenantPhone, landlordPhone, message, building_id) => {
  determine_new_twilio_number(tenantPhone, landlordPhone)
  .then((twilioNumber) => {
    console.log('send_initial_twilio_number: ', twilioNumber)
    insertCommunicationsLog({
      'ACTION': 'RENTHERO_SMS_FALLBACK',
      'DATE': new Date().getTime(),
      'COMMUNICATION_ID': shortid.generate(),
      'MEDIUM': 'SMS',

      'SENDER_ID': 'RENTHERO_SMS_FALLBACK',
      'SENDER_CONTACT_ID': 'RENTHERO_SMS_FALLBACK',
      'RECEIVER_CONTACT_ID': tenantPhone,
      'RECEIVER_ID': tenantPhone,
      'PROXY_CONTACT_ID': twilioNumber,
      'TEXT': message,
      'BUILDING_ID': building_id,
    })

    twilio_client.messages.create({
      to: tenantPhone,
      from: twilioNumber,
      body: message,
    })
    .then((data) => {
      insert_sms_match('', tenantPhone, '', landlordPhone, data.sid, twilioNumber)
    })
    // res.type('text/xml')
    // res.send(twilio_client.toString())
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
