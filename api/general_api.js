

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
