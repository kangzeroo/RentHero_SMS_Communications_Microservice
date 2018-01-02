
exports.generateInitialMessageBody_Tenant = function(info, landlord_name, message_id){
  const p = new Promise((res, rej) => {
    res(`
      Hello ${info.first_name}, you can now text the landlord directly here. The landlord, ${landlord_name}, has also recieved a text regarding your interest in ${info.building_address} with your group size of ${info.group_size}. - RentHero.ca/m/${message_id}
    `)
  })
  return p
}

exports.generateInitialMessageBody_Landlord = function(info, landlord_name, message_id){
  const p = new Promise((res, rej) => {
    res(`
      Hello ${landlord_name}, Rentburrow.com has brought you a group of ${info.group_size} students led by ${info.first_name}. ${info.gender === 'Male' ? 'His' : 'Her'} group is interested in ${info.building_address}. You can text ${info.gender === 'Male' ? 'him' : 'her'} back directly here. In the notes, ${info.first_name} said: "${info.group_notes}". - RentHero.ca/m/${message_id}
    `)
  })
  return p
}

exports.generateInitialMessageBody_Tenant_ForExistingPair = function(info, landlord_name, message_id){
  const p = new Promise((res, rej) => {
    res(`
      Hello ${info.first_name}. ${info.building_address} is also managed by ${landlord_name}. - RentHero.ca/m/${message_id}
    `)
  })
  return p
}

exports.generateInitialMessageBody_Landlord_ForExistingPair = function(info, landlord_name, message_id){
  const p = new Promise((res, rej) => {
    res(`
      Hello ${landlord_name}, ${info.first_name} on RentHero.ca is also interested in ${info.building_address}. Notes: ${info.group_notes} - RentHero.ca/m/${message_id}
    `)
  })
  return p
}
