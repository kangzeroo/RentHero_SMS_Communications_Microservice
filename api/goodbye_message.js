exports.generateGoodbyeMessageTenant = function(info, landlord_name, message_id){
  const p = new Promise((res, rej) => {
    res(`
      Hello ${info.first_name}, this chat thread with ${landlord_name} has now ended.
      [ VERIFIED RENTHERO MESSAGE: RentHero.cc/m/${message_id} ]
    `)
  })
  return p
  // - RentHero.ca/m/${message_id}
}

exports.generateGoodbyeMessageLandlord = function(info, landlord_name, message_id){
  const p = new Promise((res, rej) => {
    res(`
      Hello ${landlord_name}, this chat thread with ${info.first_name} has now ended.
      [ VERIFIED RENTHERO MESSAGE: RentHero.cc/m/${message_id} ]
    `)
  })
  return p
  // - RentHero.ca/m/${message_id}
}
