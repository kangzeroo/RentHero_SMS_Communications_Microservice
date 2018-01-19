const bodyParser = require('body-parser')
const twilio = require('twilio')
// routes
const Test = require('./routes/test_routes')
const InquiryRoutes = require('./routes/inquiry_routes')
const SMSRoutes = require('./routes/sms_routes')
const EmailRoutes = require('./routes/email_routes')
const MassSMSRoutes = require('./routes/mass_sms_routes')
const goodbyeSMSRoutes = require('./routes/goodbye_sms_routes')
const SMS_RDS_Queries = require('./routes/LeasingDB/Queries/SMSQueries')
const originCheck = require('./auth/originCheck').originCheck

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

	app.post('/initial_inquiry', [originCheck, json_encoding], InquiryRoutes.initial_inquiry)
	app.post('/initial_corporate_inquiry', [originCheck, json_encoding], InquiryRoutes.initial_corporate_inquiry)
	app.post('/message_proof', [originCheck, json_encoding], InquiryRoutes.message_proof)
	// app.post('/send_landlord_message', json_encoding, SMSRoutes.sendLandlordMessageFromTenant)

	app.post('/use-sms', [twilio.webhook({ validate: false })], SMSRoutes.sms_forwarder)
	app.post('/use-voice', [twilio.webhook({ validate: false })], SMSRoutes.voice)
	app.post('/listener', [twilio.webhook({ validate: false })], SMSRoutes.listener)
	app.post('/voice_to_text', [twilio.webhook({ validate: false })], SMSRoutes.voice_to_text)


	app.post('/send_message_to_phones', [originCheck, twilio.webhook({ validate: false })], MassSMSRoutes.send_message_to_phones)
	app.post('/send_message_to_phone', [originCheck, twilio.webhook({ validate: false })], MassSMSRoutes.send_message_to_phone)
	app.post('/receive_message_from_phone', [twilio.webhook({ validate: false })], MassSMSRoutes.receive_message_from_phone)
	app.post('/send_tenant_wait_msg', [originCheck, twilio.webhook({ validate: false })], MassSMSRoutes.send_tenant_wait_msg)
	app.post('/get_most_recent_messages', [originCheck, json_encoding], InquiryRoutes.get_most_recent_messages)

	app.post('/send_group_invitation_sms', [originCheck, twilio.webhook({ validate: false })], SMSRoutes.send_group_invitation_sms)

	app.post('/insert_tenant_landlord_sms', [json_encoding, originCheck], SMS_RDS_Queries.insert_tenant_landlord_sms)

	app.post('/sms', [twilio.webhook({ validate: false })], SMSRoutes.sms_forwarder)
	app.post('/fallback', [twilio.webhook({ validate: false })], SMSRoutes.fallback)
	app.post('/speechtotext', [twilio.webhook({ validate: false })], SMSRoutes.speechtotext)

	app.post('/email_relationship', [json_encoding], EmailRoutes.email_relationship)
	app.post('/save_email_communications_log', [json_encoding], EmailRoutes.save_email_communications_log)

	// goodbye message
	app.post('/send_goodbye_message_sms', [json_encoding, originCheck], goodbyeSMSRoutes.send_goodbye_message_sms)
}
