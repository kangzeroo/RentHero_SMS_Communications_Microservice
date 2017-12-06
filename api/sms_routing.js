
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
//   group_notes: 'asdfsadf'
// }


exports.gatherOutgoingNumber = function(incomingPhoneNumber){
  const p = new Promise((res, rej) => {

   const hostPhoneNumber = '+15195726998'
   const guestPhoneNumber = '+16475286355'

   let outgoingPhoneNumber

   if (guestPhoneNumber === incomingPhoneNumber) {
      outgoingPhoneNumber = hostPhoneNumber
    }

   if (hostPhoneNumber === incomingPhoneNumber) {
      outgoingPhoneNumber = guestPhoneNumber
    }
    res(outgoingPhoneNumber)
  })
  return p
}
