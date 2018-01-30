// AWS SES (Simple Email Service) for sending emails via Amazon
const AWS_SES = require('aws-sdk/clients/ses')
const AWS = require('aws-sdk/global')
const ses = new AWS_SES({
  region: 'us-east-1'
})
const axios = require('axios')

let LANDLORD_RESPONSIVENESS_MICROSERVICE = 'https://renthero.host:3009'
if (process.env.NODE_ENV === 'production') {
  LANDLORD_RESPONSIVENESS_MICROSERVICE = 'https://rentburrow.com:3009'
} else {
  LANDLORD_RESPONSIVENESS_MICROSERVICE = 'https://renthero.host:3009'
}

exports.generateInitialCorporateEmail = function(toEmailAddresses, proxyFromEmailAddress, tenant, tenantMessage, landlordMessage, building, suite, tenantOrLandlord){
  /*
    toEmailAddresses = ['personA@email.com', 'personB@email.com']
    proxyFromEmailAddress = 'relationshipID@renthero.cc',
    tenant = { tenant_id: '89oOHDF9f', first_name: 'Mike' }
    message = 'Hello, Renthero has generated a lead for you...'
    building = { building_id, building_alias }
    tenantOrLandlord = 'landlord' || 'tenant'
  */
  console.log('======> toEmailAddresses: ', toEmailAddresses)
  console.log('======> proxyFromEmailAddress: ', proxyFromEmailAddress)
  console.log('======> tenant: ', tenant)
  console.log('======> tenantMessage: ', tenantMessage)
  console.log('======> landlordMessage: ', landlordMessage)
  console.log('======> building: ', building)

  const p = new Promise((res, rej) => {
		if (!toEmailAddresses || toEmailAddresses.length === 0 || !proxyFromEmailAddress || !landlordMessage) {
			rej('Missing from email, proxy email, or message')
		} else {
			const params = createInitialParams(toEmailAddresses, proxyFromEmailAddress, tenant, tenantMessage, landlordMessage, building, suite)
			// console.log('Sending email with attached params!')
			AWS.config.credentials.refresh(function() {
				// console.log(AWS.config.credentials)
				ses.sendEmail(params, function(err, data) {
				  if (err) {
				  	 console.log(err); // an error occurred
				  	 rej(err)
				  } else {
				  	console.log(data);           // successful response
  					res({
              message: 'Success! Initial mail sent',
              data: data,
            })
          }
				})
			})
		}
	})
	return p
}

function createInitialParams(toEmailAddresses, proxyFromEmailAddress, tenant, tenantMessage, landlordMessage, building, suite){
  const params = {
	  Destination: { /* required */
	    BccAddresses: [
        'email.records.rentburrow@gmail.com'
      ],
	    CcAddresses: [],
	    ToAddresses: toEmailAddresses
	  },
	  Message: { /* required */
	    Body: { /* required */
	      Html: {
	        Data: generateHTMLInquiryEmail_Landlord(tenant, tenantMessage, landlordMessage, building, suite),
	        Charset: 'UTF-8'
	      },
	    },
	    Subject: { /* required */
	      Data: 'RentHero Inquiry for ' + building.building_address, /* required */
	      Charset: 'UTF-8'
	    }
	  },
	  Source: proxyFromEmailAddress,
	  ReplyToAddresses: [ proxyFromEmailAddress ],
	  ReturnPath: proxyFromEmailAddress,
	}
	return params
}

// generate the HTML email
function generateHTMLInquiryEmail_Landlord(tenant, tenantMessage, landlordMessage, building, suite){
	return `
		<!DOCTYPE html>
		<html>
		  <head>
		    <meta charset='UTF-8' />
		    <title>title</title>
		  </head>
		  <body>
		  	<table border='0' cellpadding='0' cellspacing='0' height='100%' width='100%' id='bodyTable'>
		    <tr>
		        <td align='center' valign='top'>
		            <table border='0' cellpadding='20' cellspacing='0' width='600' id='emailContainer'>
		                <tr style='background-color:#99ccff;'>
		                    <td align='center' valign='top'>
		                        <table border='0' cellpadding='20' cellspacing='0' width='100%' id='emailBody'>
                                <tr>
                                    <td align='center' valign='top' style='color:#337ab7;'>
                                        <h2>RentHero.ca Inquiry</h2>
                                    </td>
                                </tr>
		                            <tr>
		                                <td align='center' valign='top' style='color:#337ab7;'>
		                                    <h2>${building.building_address} ${suite && suite.suite_id ? suite.suite_alias : ''}</h2>
		                                    <h3>${tenant.first_name} ${tenant.last_name} sent a message:</h3>
                                        <p>${tenantMessage}</p>
		                                </td>
		                            </tr>
		                            <tr style='border: 1px solid red; font-size: 1.2rem'>
		                                <td align='center' valign='top'>
                                        <p>Please go to the link below to contact the tenant.</p>
		                                    <p>${landlordMessage}</p>
		                                </td>
		                            </tr>
		                        </table>
		                    </td>
		                </tr>
		            </table>
		        </td>
		    </tr>
		    </table>
		  </body>
		</html>
	`
}

exports.updateLandlordLastActive = function(landlord_id) {
  console.log(`updateLandlordLastActive: ${landlord_id}`)
  console.log(`${LANDLORD_RESPONSIVENESS_MICROSERVICE}/update_last_active`)
  const p = new Promise((res, rej) => {
    axios.post(`${LANDLORD_RESPONSIVENESS_MICROSERVICE}/update_last_active`, { landlord_id: landlord_id })
      .then((data) => {
        res(data.data)
      })
      .catch((err) => {
        rej(err)
      })
  })
  return p
}
