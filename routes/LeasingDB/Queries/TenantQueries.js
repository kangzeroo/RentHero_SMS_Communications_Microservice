const Promise = require('bluebird')
const { promisify } = Promise
const pool = require('../db_connect')
const uuid = require('uuid')
const unFormattedPhoneNumber = require('../../../api/general_api').unFormattedPhoneNumber

// to run a query we just pass it to the pool
// after we're done nothing has to be taken care of
// we don't have to return any client to the pool or close a connection

const query = promisify(pool.query)

// stringify_rows: Convert each row into a string
const stringify_rows = res => res.rows.map(row => JSON.stringify(row))

const json_rows = res => res.map(row => JSON.parse(row))
//log_through: log each row
const log_through = data => {
  // console.log(data)
  return data
}

exports.get_tenant_id_from_phone = (phone) => {
  console.log('get_tenant_id_from_phone:')
  const number = unFormattedPhoneNumber(phone)
  console.log('unformatted number: ', number)

  const values = [number]

  const get_tenant = `SELECT tenant_id
                        FROM tenant
                       WHERE phone = $1
                      `

  return query(get_tenant, values)
  .then((data) => {
    console.log('tenant_id: ', data.rows[0])
    return data.rows[0]
  })
  .catch((err) => {
    console.log(err)
  })
}

exports.get_tenant_from_id = (tenant_id) => {
  const values = [tenant_id]

  const get_tenant = `SELECT * FROM tenant WHERE tenant_id = $1
                      `

  return query(get_tenant, values)
  .then((data) => {
    console.log(data.rows[0])
    return data.rows[0]
  })
  .catch((err) => {
    console.log(err)
  })
}

exports.insert_employee_mapping = (employee_id, inquiry_id, building_id) => {
  const values = [uuid.v4(), employee_id, inquiry_id, building_id]

  const insert_lead = `INSERT INTO employee_mapping (mapping_id, employee_id, inquiry_id, building_id)
                                  VALUES ( $1, $2, $3, $4 )
                                ON CONFLICT (employee_id, inquiry_id) DO NOTHING
                            `
  query(insert_lead, values)
  .then((data) => {
    console.log(`INSERTED EMPLOYEE MAPPING FOR ${inquiry_id}`)
  })
  .catch((err) => {
    console.log('ERROR! insert_employee_lead: ', err)
  })
}
