const Promise = require('bluebird')
const { promisify } = Promise
const pool = require('../db_connect')
const uuid = require('uuid')
const moment = require('moment')

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

exports.get_landlord_info = (building_id) => {
  const values = [building_id]

  const get_landlord = `SELECT a.corporation_id, b.corporation_name, b.phone, b.thumbnail, b.email, b.textable,
                               c.alias_email
                          FROM corporation_building a
                          INNER JOIN corporation b
                          ON a.corporation_id = b.corporation_id
                          LEFT OUTER JOIN corporation_alias_emails c
                          ON a.corporation_id = c.corporation_id
                          WHERE a.building_id = $1
                            AND c.purpose = 'leasing'
                        `

  const return_rows = (rows) => {
    return rows[0]
  }
  return query(get_landlord, values)
    .then((data) => {
      return stringify_rows(data)
    })
    .then((data) => {
      return json_rows(data)
    })
    .then((data) => {
      return return_rows(data)
    })
    .catch((error) => {
      console.log(error)
    })
}

exports.get_landlord_from_id = (landlord_id) => {
  const values = [landlord_id]

  const get_landlord = `SELECT * FROM corporation WHERE corporation_id = $1
                        `

  const return_rows = (rows) => {
    return rows[0]
  }
  return query(get_landlord, values)
    .then((data) => {
      return stringify_rows(data)
    })
    .then((data) => {
      return json_rows(data)
    })
    .then((data) => {
      return return_rows(data)
    })
    .catch((error) => {
      console.log(error)
    })
}
