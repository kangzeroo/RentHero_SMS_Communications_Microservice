const Promise = require('bluebird')
const { promisify } = Promise
const pool = require('../db_connect')
const uuid = require('uuid')
const formattedPhoneNumber = require('../../../api/general_api').formattedPhoneNumber

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

exports.insert_tenant_landlord_sms = (req, res, next) => {
  const info = req.body

  const tenant_phone = formattedPhoneNumber(info.tenant_phone)
  const landlord_phone = formattedPhoneNumber(info.landlord_phone)
  const twilio_phone = '+12268870232'
  const notes = info.notes
  const id = uuid.v4()

  const values = [id, tenant_phone, landlord_phone, twilio_phone]

  const insert_match = `INSERT INTO sms_map (id, tenant_phone, landlord_phone, twilio_phone)
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

exports.insert_sms_match = (tenant_phone, landlord_phone, sid, twilio_phone) => {
   // const id = uuid.v4()
   const values = [sid, tenant_phone, landlord_phone, twilio_phone]

   const insert_match = `INSERT INTO sms_map (id, tenant_phone, landlord_phone, twilio_phone)
                              SELECT $1, $2, $3, $4
                              WHERE NOT EXISTS (
                                SELECT tenant_phone, landlord_phone
                                  FROM sms_map
                                 WHERE tenant_phone = $2
                                   AND landlord_phone = $3
                                )`

   query(insert_match, values)
   .then((data) => {
     console.log('INSERTED SMS MATCH')
   })
   .catch((err) => {
     console.log(err)
   })
}

exports.update_sms_match = (phone, sid) => {

  const update_match = `UPDATE sms_map
                           SET twilio_phone = '${phone}'
                         WHERE id = '${sid}' AND twilio_phone IS NULL
                        `

  query(update_match)
  .then((data) => {
    console.log("UPDATED")
  })
  .catch((err) => {
    console.log(err)
  })
}

exports.get_sms_match = (incoming_phone, twilio_phone) => {

  const values = [twilio_phone, incoming_phone]
  const get_match = `SELECT * FROM sms_map WHERE twilio_phone = $1 AND (tenant_phone = $2 OR landlord_phone = $2)`

  const return_rows = (rows) => {
          return rows[0]
        }
  return query(get_match, values)
    .then((data) => {
      return stringify_rows(data)
    })
    .then((data) => {
      return json_rows(data)
    })
    .then((data) => {
      return return_rows(data)
    })
}

exports.get_tenant_landlord_match = (tenantPhone, landlordPhone) => {
  const values = [tenantPhone, landlordPhone]
  const get_match = `SELECT twilio_phone FROM sms_map WHERE tenant_phone = $1 AND landlord_phone = $2`

  return query(get_match, values)
  .then((data) => {
    return data.rows[0]
  })
  .catch((err) => {
    console.log(err)
  })
}

exports.get_tenant_landlord_twilio_numbers = (tenantPhone, landlordPhone) => {
  const values = [tenantPhone, landlordPhone]
  const get_match = `SELECT DISTINCT twilio_phone FROM sms_map WHERE tenant_phone = $1 OR landlord_phone = $2`

  const return_rows = (rows) => {
          return rows
        }
  return query(get_match, values)
  .then((data) => {
    return stringify_rows(data)
  })
  .then((data) => {
    return json_rows(data)
  })
  .then((data) => {
    return return_rows(data)
  })
}
