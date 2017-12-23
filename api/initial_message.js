
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
      Hello ${landlord_name}, ${info.first_name} on RentHero.ca is also interested in ${info.building_address}. - RentHero.ca/m/${message_id}
    `)
  })
  return p
}


// {
//   id: '7cfcc550-39e7-44d8-8e39-2ad228908fab',
//   tenant_id: '6aa0fcd7-e7eb-4417-9fdc-9cf9d80f37ee',
//   first_name: 'Kangze',
//   last_name: 'Huang',
//   gender: 'Male',
//   school: 'Wilfrid Laurier University',
//   program_and_term: '4A AFM',
//   email: 'support@myemail.com',
//   phone: '4304580958435',
//   group_size: 2,
//   building_id: '9522777f-a6ef-4249-bfe9-b7167a2af441',
//   building_address: '185 King St North',
//   group_notes: 'asdfsadf'
// }
