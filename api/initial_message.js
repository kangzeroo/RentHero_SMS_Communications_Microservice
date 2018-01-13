
exports.generateInitialMessageBody_Tenant = function(info, landlord_name, message_id){
  const p = new Promise((res, rej) => {
    res(`
      Hello ${info.first_name}, this is ${landlord_name}, the landlord of ${info.building_address}. Text or call me directly here.
      [ VERIFIED RENTHERO MESSAGE: RentHero.cc/m/${message_id} ]
    `)
  })
  return p
  // - RentHero.ca/m/${message_id}
}

exports.generateInitialMessageBody_Landlord = function(info, landlord_name, message_id){
  const p = new Promise((res, rej) => {
    res(`
      ${`${info.group_notes}. `}My name is ${`${info.first_name} ${info.last_name ?  info.last_name : ''}`} and I saw your property ${info.building_address} on RentHero.ca. ${info.group_size === 1 ? 'I have a solo group' : `I have a group of ${info.group_size} roommates`}. Please can text or call me back directly here.
      [ VERIFIED RENTHERO MESSAGE: RentHero.cc/m/${message_id} ]
    `)
  })
  return p
  // - RentHero.ca/m/${message_id}
}

exports.generateInitialMessageBody_Tenant_ForExistingPair = function(info, landlord_name, message_id){
  const p = new Promise((res, rej) => {
    res(`
      Hello ${info.first_name}. ${info.building_address} is also managed by ${landlord_name}. How can I help you?
      [ VERIFIED RENTHERO MESSAGE: RentHero.cc/m/${message_id} ]
    `)
  })
  return p
  // - RentHero.ca/m/${message_id}
}

exports.generateInitialMessageBody_Landlord_ForExistingPair = function(info, landlord_name, message_id){
  const p = new Promise((res, rej) => {
    res(`
      Hello ${landlord_name}, ${`${info.first_name} ${info.last_name ?  info.last_name : ''}`} on RentHero.ca is also interested in ${info.building_address}. Notes: ${info.group_notes}
      [ VERIFIED RENTHERO MESSAGE: RentHero.cc/m/${message_id} ]
    `)
  })
  return p
  // - RentHero.ca/m/${message_id}
}
