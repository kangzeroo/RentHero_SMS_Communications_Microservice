

exports.corpOriginCheck = function(req, res, next){
 const origin = req.get('origin')
 if (process.env.NODE_ENV === 'production') {
   if (origin && origin.indexOf('admin.renthero.ca') > -1 || origin.indexOf('apollo.renthero.ca') > -1) {
     next()
   } else {
     res.status(500).send({
       message: 'Bad boi bad boi'
     })
   }
 } else {
   next()
   // res.status(500).send({
   //   message: 'Incorrect request origin. Not https://localhost:8081'
   // })
 }
}
