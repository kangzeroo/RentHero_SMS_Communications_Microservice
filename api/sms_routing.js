

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
