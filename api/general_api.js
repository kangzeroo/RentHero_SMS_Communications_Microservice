const axios = require('axios')
const twilio_client = require('../twilio_setup').generate_twilio_client()
const generate_error_email = require('./error_api').generate_error_email

exports.formattedPhoneNumber = (number) => {
  const countryCode = number.substring(0, 2)

  let formattedNumber

  if (countryCode === '+1') {
    formattedNumber = number.substring(2)
  } else {
    formattedNumber = number
  }

  return '+1' + formattedNumber.replace(/\D/g,'')
}

exports.verifiedPhoneNumber = (number) => {
  const p = new Promise((res, rej) => {
    // console.log('formatting Phone number', number)
    return twilio_client.lookups.v1
    .phoneNumbers(number)
    .fetch()
    .then((data) => {
      // console.log(data)
      res(data.phoneNumber)
    })
    .catch((err) => {
      generate_error_email(number, 'verifiedPhoneNumber', '')
      rej(err)
    })
  })
  return p
}

exports.unFormattedPhoneNumber = (formattedNumber) => {
  // let number
  // const countryCode = formattedNumber.substring(0, 2)
  // if (countryCode === '+1') {
  //   number = formattedNumber.substring(2)
  // } else {
  //   number = formattedNumber
  // }
  // return number
  const p = new Promise((res, rej) => {
    return twilio_client.lookups.v1
    .phoneNumbers(formattedNumber)
    .fetch()
    .then((data) => {
      // console.log(data)
      res(data.nationalFormat.replace(/\D/g,''))
    })
    .catch((err) => {
      rej(err)
    })
  })
  return p
}


exports.shortenUrl = (longUrl) => {
  const p = new Promise((res, rej) => {
    axios.post(`https://www.googleapis.com/urlshortener/v1/url?key=${process.env.GOOGLE_API_KEY}`, { longUrl: longUrl }, json_header)
      .then((data) => {
        // once we have the response, only then do we dispatch an action to Redux
        res(data.data)
      })
      .catch((err) => {
        rej(err)
      })
  })
  return p
}

const json_header = {
    headers: {
        'Content-Type': 'application/json',
    }
}
