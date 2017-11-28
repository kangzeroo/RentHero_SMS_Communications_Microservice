
// GET /test
exports.test = function(req, res, next){
  res.json({
    message: "Test says alive and well"
  })
}
