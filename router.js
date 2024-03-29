const bodyParser = require('body-parser')
const twilio = require('twilio')
// routes
const Test = require('./routes/test_routes')
const InquiryRoutes = require('./routes/inquiry_routes')
const SMSRoutes = require('./routes/sms_routes')
const EmailRoutes = require('./routes/email_routes')
const MassSMSRoutes = require('./routes/mass_sms_routes')
const FallbackRoutes = require('./routes/fallback_routes')
const goodbyeSMSRoutes = require('./routes/goodbye_sms_routes')
const VoiceRoutes = require('./routes/voice_routes')
const StaffMessaging = require('./routes/staff_messaging')
const PhoneLookupRoutes = require('./routes/phone_lookup_routes')
const ApolloConnectRoutes = require('./routes/Apollo/apollo_connect')
const originCheck = require('./auth/originCheck').originCheck
const corpOriginCheck = require('./auth/corpOriginCheck').corpOriginCheck

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
	app.post('/initial_corporate_mapping_inquiry', [originCheck, json_encoding], InquiryRoutes.initial_corporate_mapping_inquiry)
	app.post('/message_proof', [originCheck, json_encoding], InquiryRoutes.message_proof)
	// app.post('/send_landlord_message', json_encoding, SMSRoutes.sendLandlordMessageFromTenant)

	app.post('/use-sms', [twilio.webhook({ validate: false })], SMSRoutes.sms_forwarder)
	app.post('/listener', [twilio.webhook({ validate: false })], SMSRoutes.listener)

	// FallBack Routes
	app.post('/stranger-message', [twilio.webhook({ validate: false })], FallbackRoutes.stranger_message)

	app.post('/use-voice', [twilio.webhook({ validate: false })], VoiceRoutes.voice)
	app.post('/voice_fallback', [twilio.webhook({ validate: false })], VoiceRoutes.voice_fallback)
	app.post('/voice_status_changes', [twilio.webhook({ validate: false })], VoiceRoutes.voice_status_changes)
	app.post('/stranger-call', [twilio.webhook({ validate: false })], VoiceRoutes.stranger_call)
	app.post('/get_all_calls', [corpOriginCheck, json_encoding], VoiceRoutes.get_all_calls)
	app.post('/get_calls_from', [corpOriginCheck, json_encoding], VoiceRoutes.get_calls_from)
	app.post('/get_calls_to', [corpOriginCheck, json_encoding], VoiceRoutes.get_calls_to)
	app.post('/get_calls_from_to', [corpOriginCheck, json_encoding], VoiceRoutes.get_calls_from_to)
	app.post('/get_recordings_for_given_call', [corpOriginCheck, json_encoding], VoiceRoutes.get_recordings_for_given_call)

	app.post('/send_message_to_phones', [originCheck, twilio.webhook({ validate: false })], MassSMSRoutes.send_message_to_phones)
	app.post('/send_message_to_phone', [originCheck, twilio.webhook({ validate: false })], MassSMSRoutes.send_message_to_phone)
	app.post('/receive_message_from_phone', [twilio.webhook({ validate: false })], MassSMSRoutes.receive_message_from_phone)
	// app.post('/send_tenant_wait_msg', [originCheck, twilio.webhook({ validate: false })], MassSMSRoutes.send_tenant_wait_msg)
	app.post('/get_most_recent_messages', [originCheck, json_encoding], InquiryRoutes.get_most_recent_messages)
	app.post('/callback', [twilio.webhook({ validate: false })], MassSMSRoutes.callback)

	app.post('/send_group_invitation_sms', [originCheck, twilio.webhook({ validate: false })], MassSMSRoutes.send_group_invitation_sms)

	app.post('/sms', [twilio.webhook({ validate: false })], SMSRoutes.sms_forwarder)
	app.post('/fallback', [twilio.webhook({ validate: false })], SMSRoutes.fallback)
	// app.post('/speechtotext', [twilio.webhook({ validate: false })], SMSRoutes.speechtotext)

	app.post('/email_relationship', [json_encoding], EmailRoutes.email_relationship)
	app.post('/save_email_communications_log', [json_encoding], EmailRoutes.save_email_communications_log)


	// Staff To Tenant Mappings
	app.post('/set_mapping_with_tenant', [json_encoding, corpOriginCheck], StaffMessaging.set_mapping_with_tenant)

	// goodbye message
	app.post('/send_goodbye_message_sms', [json_encoding, originCheck], goodbyeSMSRoutes.send_goodbye_message_sms)

	// phone Lookup Routes
	app.post('/phone_lookup', [json_encoding], PhoneLookupRoutes.phone_lookup)
	app.post('/phone_test', [json_encoding], PhoneLookupRoutes.phone_test)
	app.post('/pre_call', [json_encoding], PhoneLookupRoutes.pre_call)
	app.post('/create_session', [json_encoding], PhoneLookupRoutes.create_session)
	app.post('/create_participant', [json_encoding], PhoneLookupRoutes.create_participant)

	app.post('/apollo_connect', [json_encoding, corpOriginCheck], ApolloConnectRoutes.apollo_connect_with_tenant)
}
