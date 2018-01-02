const bodyParser = require('body-parser')
const twilio = require('twilio')
// routes
const Test = require('./routes/test_routes')
const SMSRoutes = require('./routes/sms_routes')
const EmailRoutes = require('./routes/email_routes')
const MassSMSRoutes = require('./routes/mass_sms_routes')
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

	app.post('/initial', [json_encoding], SMSRoutes.initial_contact)
	// app.post('/send_landlord_message', json_encoding, SMSRoutes.sendLandlordMessageFromTenant)

	app.post('/use-sms', twilio.webhook({ validate: false }), SMSRoutes.sms_forwarder)
	app.post('/use-voice', twilio.webhook({ validate: false }), SMSRoutes.voice)
	app.post('/listener', twilio.webhook({ validate: false }), SMSRoutes.listener)
	app.post('/voice_to_text', twilio.webhook({ validate: false }), SMSRoutes.voice_to_text)


	app.post('/send_message_to_phones', twilio.webhook({ validate: false }), MassSMSRoutes.send_message_to_phones)
	app.post('/send_message_to_phone', twilio.webhook({ validate: false }), MassSMSRoutes.send_message_to_phone)
	app.post('/receive_message_from_phone', twilio.webhook({ validate: false }), MassSMSRoutes.receive_message_from_phone)


	app.post('/send_group_invitation_sms', twilio.webhook({ validate: false }), SMSRoutes.send_group_invitation_sms)

	app.post('/insert_tenant_landlord_sms', json_encoding, SMS_RDS_Queries.insert_tenant_landlord_sms)


	app.post('/sms', twilio.webhook({ validate: false }), SMSRoutes.sms_forwarder)
	app.post('/stickysms', twilio.webhook({ validate: false }), SMSRoutes.stickysms)
	app.post('/fallback', twilio.webhook({ validate: false }), SMSRoutes.fallback)
	app.post('/speechtotext', twilio.webhook({ validate: false }), SMSRoutes.speechtotext)

	app.post('/send_initial_email', [json_encoding], EmailRoutes.send_initial_email)
	app.post('/email_relationship', [json_encoding], EmailRoutes.email_relationship)
	app.post('/save_email_communications_log', [json_encoding], EmailRoutes.save_email_communications_log)
}
