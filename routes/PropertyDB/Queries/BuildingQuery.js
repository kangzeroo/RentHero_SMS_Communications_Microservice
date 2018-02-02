const Promise = require('bluebird')
const { promisify } = Promise
const pool = require('../db_connect')
const uuid = require('uuid')
const moment = require('moment')

// to run a query we just pass it to the pool
// after we're done nothing has to be taken care of
// we don't have to return any client to the pool or close a connection

const query = promisify(pool.query)

const stringify_rows = res => res.rows.map(row => JSON.stringify(row))

const json_rows = res => res.map(row => JSON.parse(row))


exports.get_all_building_addresses = () => {

  const get_landlord = `SELECT a.building_id, a.building_alias, b.building_address,
                               c.corporation_id
                          FROM building a
                          INNER JOIN (SELECT address_id, gps_x, gps_y,
                                CONCAT(street_code, ' ', street_name) AS building_address
                           FROM address
                         ) b
                        ON a.address_id = b.address_id
                        INNER JOIN corporation_building c
                        ON a.building_id = c.building_id
                        INNER JOIN (SELECT building_id FROM building_details WHERE active=true) d
                        ON a.building_id = d.building_id
                        `

  const return_rows = (rows) => {
    return rows
  }
  return query(get_landlord)
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

exports.get_all_buildings_from_landlord_ids = (landlord_ids) => {

  const array_of_ids = landlord_ids.map((val, index) => { return `$${index + 1}` }).join(', ')
  const values = landlord_ids

  const get_buildings = `SELECT a.building_id, a.building_alias, b.building_address,
                               c.corporation_id
                          FROM building a
                          INNER JOIN (SELECT address_id, gps_x, gps_y,
                                CONCAT(street_code, ' ', street_name) AS building_address
                           FROM address
                         ) b
                        ON a.address_id = b.address_id
                        INNER JOIN corporation_building c
                        ON a.building_id = c.building_id
                        INNER JOIN (SELECT building_id FROM building_details WHERE active=true) d
                        ON a.building_id = d.building_id
                        WHERE c.corporation_id in (${array_of_ids})
                        `


  const return_rows = (rows) => {
    return rows
  }

  return query(get_buildings, values)
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
