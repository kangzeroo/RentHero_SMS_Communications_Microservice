const bodyParser = require('body-parser')
// routes
const Test = require('./routes/test_routes')


// bodyParser attempts to parse any request into JSON format
const json_encoding = bodyParser.json({type:'*/*'})
// bodyParser attempts to parse any request into GraphQL format
// const graphql_encoding = bodyParser.text({ type: 'application/graphql' })

module.exports = function(app){

	app.use(bodyParser())

	// routes
	app.get('/test', json_encoding, Test.test)
	app.post('/send_message', json_encoding, Test.send_message)
	app.post('/copilot_message', json_encoding, Test.copilot_message)

	app.get('/inbound', json_encoding, Test.inbound)
	app.post('/outbound', json_encoding, Test.outbound)
}
