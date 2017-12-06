const Promise = require('bluebird')
const { promisify } = Promise
const pool = require('../db_connect')
const uuid = require('uuid')

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

const formattedPhoneNumber = (number) => {
  return '+1' + number.replace(/\D/, '')
}

exports.insert_tenant_landlord_sms = (req, res, next) => {
  const info = req.body

  const tenant_phone = formattedPhoneNumber(info.tenant_phone)
  const landlord_phone = formattedPhoneNumber(info.landlord_phone)
  const twilio_phone = '+12268870232'
  const notes = info.notes
  const id = uuid.v4()

  const values = [id, tenant_phone, landlord_phone, twilio_phone]

  const insert_match = `INSERT INTO tenant_landlord_phones (id, tenant_phone, landlord_phone, twilio_phone)
                                                    VALUES ($1, $2, $3, $4)
                        `

  query(insert_match, values)
  .then((data) => {
    res.json({
      message: 'Successfully inserted tenant landlord phone match'
    })
  })
  .catch((err) => {
    console.log(err)
  })
}
