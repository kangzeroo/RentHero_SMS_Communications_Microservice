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

exports.get_email_forwarding_relationship = (sender_actual_email, receiver_alias_email) => {
  const values = [sender_actual_email, receiver_alias_email]

  const get_relationship = `SELECT *
                              FROM email_map
                             WHERE (LOWER(tenant_email) = $1 AND LOWER(landlord_alias_email) = $2)
                                OR (LOWER(landlord_email) = $1 AND LOWER(tenant_alias_email) = $2)
                            `

    const return_rows = (rows) => {
      return rows[0]
    }

    return query(get_relationship, values)
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


// THIS SHOULD RETURN THE RELATIONSHIP (both if already existing or not)
exports.insert_email_relationship = (tenantId, tenantEmail, tenantAliasEmail, corporationId, corporationEmail, corporationAliasEmail) => {
  const p = new Promise((res, rej) => {
    const values = [uuid.v4(), tenantId, tenantEmail, tenantAliasEmail, corporationId, corporationEmail, corporationAliasEmail]

    const insert_relationship = `WITH a AS (INSERT INTO email_map (id, tenant_id, tenant_email, tenant_alias_email, landlord_id, landlord_email, landlord_alias_email)
                                      SELECT $1, $2, $3, $4, $5, $6, $7
                                      WHERE NOT EXISTS (
                                        SELECT tenant_id, tenant_email,
                                               landlord_id, landlord_email
                                          FROM email_map
                                        WHERE tenant_id = $2
                                          AND tenant_email = $3
                                          AND landlord_id = $5
                                          AND landlord_email = $6
                                      ) RETURNING *),
                                      b AS (SELECT * FROM email_map
                                      WHERE tenant_id = $2
                                        AND tenant_email = $3
                                        AND landlord_id = $5
                                        AND landlord_email = $6)
                              SELECT * FROM b UNION ALL SELECT * FROM a
                                `

    query(insert_relationship, values)
      .then((data) => {
        console.log('INSERTED EMAIL RELATIONSHIP')
        res(data.rows[0])
      })
      .catch((err) => {
        console.log('ERROR: ', err)
        rej(err)
      })
  })
  return p
}
