const bodyParser = require('body-parser')
const twilio = require('twilio')
// routes
const Test = require('./routes/test_routes')
const SMSRoutes = require('./routes/sms_routes')
const SMS_RDS_Queries = require('./routes/LeasingDB/Queries/SMSQueries')

// bodyParser attempts to parse any request into JSON format
const json_encoding = bodyParser.json({type:'*/*'})
// bodyParser attempts to parse any request into GraphQL format
// const graphql_encoding = bodyParser.text({ type: 'application/graphql' })

module.exports = function(app){

	app.use(bodyParser())

	// routes
	app.get('/test', json_encoding, Test.test)
	// app.post('/send_message', json_encoding, Test.send_message)
	// app.post('/copilot_message', json_encoding, Test.copilot_message)

	// app.get('/inbound', json_encoding, Test.inbound)
	// app.post('/outbound', json_encoding, Test.outbound)
	// app.post('/use-sms', twilio.webhook({ validate: false }), Test.sms)

	app.post('/initial', json_encoding, SMSRoutes.initial_contact)
	// app.post('/send_landlord_message', json_encoding, SMSRoutes.sendLandlordMessageFromTenant)

	app.post('/use-sms', twilio.webhook({ validate: false }), SMSRoutes.sms_forwarder)
	app.post('/use-voice', twilio.webhook({ validate: false }), SMSRoutes.voice)
	app.post('/listener', twilio.webhook({ validate: false }), SMSRoutes.listener)

	app.post('/send_group_invitation_sms', twilio.webhook({ validate: false }), SMSRoutes.send_group_invitation_sms)

	app.post('/insert_tenant_landlord_sms', json_encoding, SMS_RDS_Queries.insert_tenant_landlord_sms)


	app.post('/sms', twilio.webhook({ validate: false }), SMSRoutes.sms_forwarder)
	app.post('/stickysms', twilio.webhook({ validate: false }), SMSRoutes.stickysms)
	app.post('/fallback', twilio.webhook({ validate: false }), SMSRoutes.fallback)
	app.post('/speechtotext', twilio.webhook({ validate: false }), SMSRoutes.speechtotext)
}
