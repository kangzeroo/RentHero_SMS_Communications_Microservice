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
  const p = new Promise((res, rej) => {
    console.log('get_tenant_id_from_phone:')
    unFormattedPhoneNumber(phone)
    .then((number) => {
      const get_tenant = `SELECT tenant_id
                            FROM tenant
                           WHERE phone LIKE '%${number}%'
                          `

      return query(get_tenant)
    })
    .then((data) => {
      console.log('tenant_id: ', data.rows[0])
      res(data.rows[0])
    })
    .catch((err) => {
      console.log(err)
      rej(err)
    })
  })
  return p
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
