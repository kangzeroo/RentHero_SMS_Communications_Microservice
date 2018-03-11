
exports.generateInitialMessageBody_Tenant = function(info, landlord, message_id){
  const p = new Promise((res, rej) => {
    if (landlord.textable) {
      res(`
        Hello ${info.first_name}, this is ${landlord.landlordName}, the landlord of ${info.building_address}. You can text or call me directly here.\n[ RENTHERO TERMS OF USE: RentHero.cc/m/${message_id} ]
      `)
    } else {
      res(`
        Hello ${info.first_name}, this is ${landlord.landlordName}, the landlord of ${info.building_address}. Please give me a call, I do not have text messaging enabled.\n[ RENTHERO TERMS OF USE: RentHero.cc/m/${message_id} ]
      `)
    }

  })
  return p
  // - RentHero.ca/m/${message_id}
}

exports.generateInitialMessageBody_Landlord = function(info, landlord, message_id){
  const p = new Promise((res, rej) => {
    res(`
      My name is ${`${info.first_name} ${info.last_name ?  info.last_name : ''}`} and I saw your property ${info.building_address} on RentHero.ca. ${info.group_size === 1 ? 'I have a solo group' : `I have a group of ${info.group_size} roommates`}. Student Notes: "${`${info.group_notes}.`}" Please text or call me back directly here.\n[ RENTHERO TERMS OF USE: RentHero.cc/m/${message_id} ]
    `)
  })
  return p
  // - RentHero.ca/m/${message_id}
}

exports.generateInitialMessageBody_Tenant_ForExistingPair = function(info, landlord, message_id){
  const p = new Promise((res, rej) => {
    if (landlord.textable) {
      res(`
        Hello ${info.first_name}. ${info.building_address} is also managed by ${landlord.landlordName}. How can I help you?\n[ RENTHERO TERMS OF USE: RentHero.cc/m/${message_id} ]
      `)
    } else {
      res(`
        Hello ${info.first_name}. ${info.building_address} is also managed by ${landlord.landlordName}. Please give me a call, I do not have text messaging enabled.\n[ RENTHERO TERMS OF USE: RentHero.cc/m/${message_id} ]
      `)
    }

  })
  return p
  // - RentHero.ca/m/${message_id}
}

exports.generateInitialMessageBody_Landlord_ForExistingPair = function(info, landlord, message_id){
  const p = new Promise((res, rej) => {
    res(`
      Hello ${landlord.landlordName}, ${`${info.first_name} ${info.last_name ?  info.last_name : ''}`} on RentHero.ca is also interested in ${info.building_address}. Notes: ${info.group_notes}\n[ RENTHERO TERMS OF USE: RentHero.cc/m/${message_id} ]
    `)
  })
  return p
  // - RentHero.ca/m/${message_id}
}
