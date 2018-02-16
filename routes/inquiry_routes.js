const AWS = require('aws-sdk')
const aws_config = require('../credentials/aws_config')
const COMMUNICATIONS_HISTORY = require('../message_logs/schema/dynamodb_tablenames').COMMUNICATIONS_HISTORY
const dynaDoc = require("dynamodb-doc")
AWS.config.update(aws_config)
const Rx = require('rxjs')
const moment = require('moment')

const dynamodb = new AWS.DynamoDB({
  dynamodb: '2012-08-10',
  region: "us-east-1"
})
const docClient = new dynaDoc.DynamoDB(dynamodb)

const send_initial_email = require('./email_routes').send_initial_email
const send_initial_sms = require('./sms_routes').send_initial_sms
const send_initial_corporate_email = require('./email_routes').send_initial_corporate_email
const send_initial_corporate_sms = require('./sms_routes').send_initial_corporate_sms
const send_wait_msg_to_tenant = require('./mass_sms_routes').send_wait_msg_to_tenant
const send_office_hours_ended_to_tenant = require('./mass_sms_routes').send_office_hours_ended_to_tenant

const sendEmployeeMappedEmail = require('../api/employee_email_api').sendEmployeeMappedEmail
const get_landlord_info = require('./PropertyDB/Queries/LandlordQuery').get_landlord_info
const get_all_employees_from_corporation = require('./PropertyDB/Queries/LandlordQuery').get_all_employees_from_corporation
const insert_employee_mapping = require('./PropertyDB/Queries/LandlordQuery').insert_employee_mapping

// Landlord Queries
const get_employee_assigned_to_building = require('./PropertyDB/Queries/LandlordQuery').get_employee_assigned_to_building

// POST /initial_inquiry
exports.initial_inquiry = function(request, response, next) {
  const p = new Promise((res, rej) => {
    // 1. send an email to the landlord
    send_initial_email(request.body)
      .then((landlordObj) => {
        // 2. check if the landlord has a phone, and if so, send an SMS
        if (landlordObj.phone) {
          return send_initial_sms(request.body)
        } else {
          return Promise.resolve()
        }
      })
      .then((data) => {
        console.log(data)
        response.json({
          status: 'Success'
        })
      })
      .catch((err) => {
        console.log(err)
        response.status(500).send(err)
      })
  })
  return p
}

exports.initial_corporate_inquiry = function(request, response, next) {
  const p = new Promise((res, rej) => {
    const info = request.body
    const tenant = info.tenant // tenant_id, first_name, last_name, phone
    const building = info.building // building_id, building_alias, building_address
    const suite = info.suite // suite_id, suite_alias
    // const corporation = info.corporation // corporation_id, corporation_email, corporation_name
    const group = info.group // group_notes, group_size
    const inquiry_id = info.inquiry_id

    // First, let's get the corporation behind the building
    get_landlord_info(building.building_id)
    .then((landlordData) => {
      const corporation = {
        corporation_id: landlordData.corporation_id,
        corporation_email: landlordData.email,
        corporation_name: landlordData.corporation_name,
      }
      // if office hours on and office hours between start and end time go here, else send the inquiry email
      const curTime = moment().subtract('hours', 5).format('HHmm')
      if ((!landlordData.office_hours) || (landlordData.office_hours && (curTime >= landlordData.office_hours_start) && (curTime <= landlordData.office_hours_end))) {
        if (landlordData.random_assign) {
          console.log('===RANDOMIZED ASSIGNMENT===')
          // Get a list of all the employees for this corporation
          get_all_employees_from_corporation(landlordData.corporation_id)
          .then((employeesData) => {
            // console.log(employeesData)

            // randomly select an employee from the list
            const selectedEmployee = employeesData[Math.floor(Math.random() * employeesData.length)]
            console.log('selected employee: ', selectedEmployee)

            // start the chat thread
            send_initial_corporate_sms(tenant, corporation, building, group, selectedEmployee)
            .then((data) => {
              return insert_employee_mapping(selectedEmployee.employee_id, inquiry_id, building.building_id)
            })
            .then((data) => {
              // start the email thread
              return send_initial_corporate_email(tenant, corporation, building, group.group_notes, selectedEmployee)
            })
            .then((data) => {
              // now send an email to the corporation's general inbox
              return sendEmployeeMappedEmail(corporation.corporation_email, selectedEmployee, tenant, building, group)
            })
            .then((data) => {
              console.log(data)
              response.json({
                status: 'Success',
              })
            })
            .catch((err) => {
              console.log(err)
              response.status(500).send(err)
            })
          })
        } else {
          console.log('===BUILDING ASSIGNMENT===')
          // First, get the employees assigned to this building
          get_employee_assigned_to_building(building.building_id)
          .then((employeeData) => {
              if (employeeData && employeeData.employee_id) {
                // if there is an employee asssigned to this building already
                console.log('Employee Exists!')

                const employee = employeeData     // employee_id, first_name, last_name, email, alias_email, phone, calvary

                // start the chat thread
                send_initial_corporate_sms(tenant, corporation, building, group, employee)
                .then((data) => {
                  return insert_employee_mapping(employee.employee_id, inquiry_id, building.building_id)
                })
                .then((data) => {
                  // start the email thread
                  return send_initial_corporate_email(tenant, corporation, building, group.group_notes, employee)
                })
                .then((data) => {
                  // now send an email to the corporation's general inbox
                  return sendEmployeeMappedEmail(corporation.corporation_email, employee, tenant, building, group)
                })
                .then((data) => {
                  console.log(data)
                  response.json({
                    status: 'Success',
                  })
                })
                .catch((err) => {
                  console.log(err)
                  response.status(500).send(err)
                })
              } else {
                console.log('Employee Does Not Exist')
                // if there is no employee assigned to this building
                // send_wait_msg_to_tenant, which accomplishes the following:
                //    1. Send a wait message to the tenant
                //    2. Send an email to the corporation's general inbox

                send_wait_msg_to_tenant(tenant, building, suite, corporation, group, inquiry_id)
                .then((data) => {
                  console.log(data)
                  response.json({
                    status: 'Success',
                  })
                })
                .catch((err) => {
                  console.log(err)
                  response.status(500).send(err)
                })
              }
          })
        }
      } else {
        send_office_hours_ended_to_tenant(tenant, building, suite, corporation, group, inquiry_id)
        .then((data) => {
          console.log(data)
          response.json({
            status: 'Success',
          })
        })
        .catch((err) => {
          console.log(err)
          response.status(500).send(err)
        })
      }
    })
  })
  return p
}

exports.initial_corporate_mapping_inquiry = function(req, response, next) {
    const p = new Promise((res, rej) => {
      const info = req.body
      const tenant = info.tenant // tenant_id, first_name, last_name, phone
      const building = info.building // building_id, building_alias, building_address
      const corporation = info.corporation // corporation_id, corporation_email, corporation_name
      const group = info.group // group_notes, group_size
      // const inquiry_id = info.inquiry_id
      const corporateEmployee = info.corporateEmployee

      send_initial_corporate_sms(tenant, corporation, building, group, corporateEmployee)
      .then((data) => {
        // start the email thread
        return send_initial_corporate_email(tenant, corporation, building, group.group_notes, corporateEmployee)
      })
      .then((data) => {
        // now send an email to the corporation's general inbox
        return sendEmployeeMappedEmail(corporation.corporation_email, corporateEmployee, tenant, building, group)
      })
      .then((data) => {
        console.log(data)
        response.json({
          status: 'Success',
        })
      })
      .catch((err) => {
        console.log(err)
        response.status(500).send(err)
      })
    })
    return p
}

// const p = new Promise((res, rej) => {
//   // 1. send an email to the landlord
//   send_initial_corporate_email(request.body)
//     .then((landlordObj) => {
//       // 2. check if the landlord has a phone, and if so, send an SMS
//       if (landlordObj.phone) {
//         return send_initial_corporate_sms(request.body)
//       } else {
//         return Promise.resolve()
//       }
//     })
//     .then((data) => {
//       console.log(data)
//       response.json({
//         status: 'Success'
//       })
//     })
//     .catch((err) => {
//       console.log(err)
//       response.status(500).send(err)
//     })
// })

// POST /message_proof
exports.message_proof = function(request, resolve, next) {
  const comm_id = request.body.comm_id
  const params = {
    "TableName": COMMUNICATIONS_HISTORY,
    "FilterExpression": "#COMMUNICATION_ID = :comm_id",
    "ExpressionAttributeNames": {
      "#COMMUNICATION_ID": "COMMUNICATION_ID",
      "#DATE": "DATE",
      "#TEXT": "TEXT"
    },
    "ExpressionAttributeValues": {
      ":comm_id": comm_id,
    },
    "ProjectionExpression": "#COMMUNICATION_ID, #DATE, #TEXT"
  }
  let Items = []
  const onNext = ({ obs, params }) => {
    setTimeout(() => {
      console.log('OBSERVABLE NEXT')
      console.log('=========== accumlated size: ' + Items.length)
      docClient.scan(params, (err, data) => {
        if (err){
          console.log(err, err.stack); // an error occurred
          obs.error(err)
        }else{
          console.log(data);           // successful response
          Items = Items.concat(data.Items)
          if (data.LastEvaluatedKey) {
            params.ExclusiveStartKey = data.LastEvaluatedKey
            obs.next({
              obs,
              params
            })
          } else {
            obs.complete(data)
          }
        }
      })
    }, 1500)
  }
  Rx.Observable.create((obs) => {
    obs.next({
      obs,
      params
    })
  }).subscribe({
    next: onNext,
    error: (err) => {
      console.log('OBSERVABLE ERROR')
      console.log(err)
    },
    complete: (y) => {
      console.log('OBSERVABLE COMPLETE')
      console.log(Items.length)
      if (Items.length > 0 && Items[0].ACTION !== 'FORWARDED_MESSAGE') {
        resolve.json(Items[0])
      } else {
        resolve.status(500).send({
          message: 'NO SUCH COMMUNICATION'
        })
      }
    }
  })
}

// POST /get_most_recent_messages
exports.get_most_recent_messages = function(request, resolve, next) {
  console.log('get_most_recent_messages')
  // console.log(request.body)
  // resolve.json([])
  const p = new Promise((res, rej) => {

    const params = {
      "TableName": COMMUNICATIONS_HISTORY,
      "FilterExpression": "#DATE > :date",
      "ExpressionAttributeNames": {
        "#DATE": "DATE"
      },
      "ExpressionAttributeValues": {
        ":date": unixDateSince(10)
      }
    }
    let Items = []
    const onNext = ({ obs, params }) => {
      setTimeout(() => {
        console.log('OBSERVABLE NEXT')
        console.log('=========== accumlated size: ' + Items.length)
        docClient.scan(params, (err, data) => {
          if (err){
            console.log(err, err.stack); // an error occurred
            obs.error(err)
          }else{
            console.log(data);           // successful response
            Items = Items.concat(data.Items)
            if (data.LastEvaluatedKey) {
              params.ExclusiveStartKey = data.LastEvaluatedKey
              obs.next({
                obs,
                params
              })
            } else {
              obs.complete(data)
            }
          }
        })
      }, 1500)
    }
    Rx.Observable.create((obs) => {
      obs.next({
        obs,
        params
      })
    }).subscribe({
      next: onNext,
      error: (err) => {
        console.log('OBSERVABLE ERROR')
        console.log(err)
      },
      complete: (y) => {
        console.log('OBSERVABLE COMPLETE')
        console.log(Items.length)
        res(Items)
      }
    })
  }).then((data) => {
    resolve.json(data)
  }).catch((err) => {
    resolve.status(500).send(err)
  })
}

const unixDateSince = (numDays) => {
  const today = new Date()
  const todayUnix = today.getTime()
  const sinceUnix = todayUnix - (numDays*24*60*60*1000)
  return sinceUnix
}
