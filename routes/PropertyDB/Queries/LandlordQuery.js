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

  const get_landlord = `SELECT a.corporation_id, b.corporation_name, b.phone,
                               b.thumbnail, b.email, b.textable, b.random_assign,
                               b.corporate_landlord, c.alias_email
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

  const get_landlord = `SELECT a.corporation_id, a.corporation_name, a.email, a.phone,
                               a.website, a.thumbnail, a.created_at, a.corporate_landlord,
                               b.employee_id, c.phone AS employee_phone
                          FROM corporation a
                          LEFT OUTER JOIN employee_corporation b
                          ON a.corporation_id = b.corporation_id
                          LEFT OUTER JOIN employee c
                          ON b.employee_id = c.employee_id
                          WHERE a.corporation_id = $1
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

exports.get_employee_assigned_to_building = (builing_id) => {
  const values = [builing_id]

  const get_employee = `SELECT b.employee_id, b.first_name, b.last_name, b.email, b.alias_email, b.phone, b.cavalry
                          FROM employee_assignments a
                          INNER JOIN employee b
                          ON a.employee_id = b.employee_id
                          WHERE a.building_id = $1
                       `

  const return_rows = (rows) => {
    return rows[0]
  }
  return query(get_employee, values)
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

exports.get_all_employees_from_corporation = (corporation_id) => {
  const values = [corporation_id]

  const get_employee = `SELECT a.employee_id, a.first_name, a.last_name, a.email, a.phone, a.alias_email, a.cavalry
                          FROM employee a
                          INNER JOIN employee_corporation b
                          ON a.employee_id = b.employee_id
                          WHERE b.corporation_id = $1
                       `

  const return_rows = (rows) => {
    return rows
  }
  return query(get_employee, values)
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
