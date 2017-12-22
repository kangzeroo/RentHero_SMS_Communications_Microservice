const axios = require('axios')

exports.formattedPhoneNumber = (number) => {
  const countryCode = number.substring(0, 2)

  let formattedNumber

  if (countryCode === '+1') {
    formattedNumber = number.substring(3)
  } else {
    formattedNumber = number
  }

  return '+1' + formattedNumber.replace(/\D/g,'')
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
