// 
// const twilio = require('twilio')
// const MessagingResponse = twilio.twiml.MessagingResponse
//
// router.post('/use-sms', twilio.webhook({ validate: false }), function (req, res) {
//   const from = req.body.From;
//   const to   = req.body.To;
//   const body = req.body.Body;
//
//   gatherOutgoingNumber(from, to)
//   .then(function (outgoingPhoneNumber) {
//     var messagingResponse = new MessagingResponse();
//     messagingResponse.message({ to: outgoingPhoneNumber }, body);
//
//     res.type('text/xml');
//     res.send(messagingResponse.toString());
//   })
// });
//
// const gatherOutgoingNumber = (incomingPhoneNumber) => {
// //  const phoneNumber = anonymousPhoneNumber
//
//   const hostPhoneNumber = '+15195726998'
//   const guestPhoneNumber = '+16475286355'
//
//   let outgoingPhoneNumber
//
//   if (guestPhoneNumber === incomingPhoneNumber) {
//     outgoingPhoneNumber = hostPhoneNumber
//   }
//
//   if (hostPhoneNumber === incomingPhoneNumber) {
//     outgoingPhoneNumber = guestPhoneNumber
//   }
//
//   return outgoingPhoneNumber
// }
//
//
//
//
// var formattedPhoneNumber = function(user) {
//   return "+" + user.countryCode + user.areaCode + user.phoneNumber;
// };
