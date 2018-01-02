// AWS SES (Simple Email Service) for sending emails via Amazon
const AWS_SES = require('aws-sdk/clients/ses')
const AWS = require('aws-sdk/global')
const ses = new AWS_SES({
  region: 'us-east-1'
})

exports.generateInitialEmail = function(toEmailAddresses, proxyEmailAddress, tenant, message, building, tenantOrLandlord){
  /*
    toEmailAddresses = ['personA@email.com', 'personB@email.com']
    proxyEmailAddress = 'relationshipID@renthero.cc',
    tenant = { tenant_id: '89oOHDF9f', first_name: 'Mike' }
    message = 'Hello, Renthero has generated a lead for you...'
    building = { building_id, building_alias }
    tenantOrLandlord = 'landlord' || 'tenant'
  */
  console.log('======> toEmailAddresses: ', toEmailAddresses)
  console.log('======> proxyEmailAddress: ', proxyEmailAddress)
  console.log('======> tenant: ', tenant)
  console.log('======> message: ', message)
  console.log('======> building: ', building)
  console.log('======> tenantOrLandlord: ', tenantOrLandlord)

  const p = new Promise((res, rej) => {
		if (!toEmailAddresses || toEmailAddresses.length === 0 || !proxyEmailAddress || !message) {
			rej('Missing from email, proxy email, or message')
		} else {
			const params = createInitialParams(toEmailAddresses, proxyEmailAddress, tenant, message, building, tenantOrLandlord)
			// console.log('Sending email with attached params!')
			AWS.config.credentials.refresh(function() {
				// console.log(AWS.config.credentials)
				ses.sendEmail(params, function(err, data) {
				  if (err) {
				  	 console.log(err); // an error occurred
				  	 rej(err)
				  } else {
				  	// console.log(data);           // successful response
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

function createInitialParams(toEmailAddresses, proxyEmailAddress, tenant, message, building, tenantOrLandlord){
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
	        Data: tenantOrLandlord === 'landlord' ? generateHTMLInquiryEmail_Landlord(tenant, message, building) : generateHTMLInquiryEmail_Tenant(tenant, message, building),
	        Charset: 'UTF-8'
	      },
	    },
	    Subject: { /* required */
	      Data: 'RentHero Inquiry for ' + building.building_address, /* required */
	      Charset: 'UTF-8'
	    }
	  },
	  Source: proxyEmailAddress,
	  ReplyToAddresses: [ proxyEmailAddress ],
	  ReturnPath: proxyEmailAddress,
	}
	return params
}

// generate the HTML email
function generateHTMLInquiryEmail_Landlord(tenant, message, building){
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
		                <tr style='background-color:#74a9d8'>
		                    <td align='center' valign='top'>
		                        <table border='0' cellpadding='20' cellspacing='0' width='100%' id='emailHeader'>
		                            <tr>
		                                <td align='center' valign='top'>
		                                    <img src='https://s3.amazonaws.com/${'rentburrow3-images'}/rentburrow_logo.png' style='width:150px; height: auto; margin: auto;' />
		                                </td>
		                            </tr>
		                        </table>
		                    </td>
		                </tr>
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
		                                    <h2>${building.building_address}</h2>
		                                    <h3>${tenant.first_name} ${tenant.last_name} sent a message:</h3>
		                                </td>
		                            </tr>
		                            <tr style='border: 1px solid red; font-size: 1.2rem'>
		                                <td align='center' valign='top'>
		                                    <p>${message}</p>
		                                </td>
		                            </tr>
		                            <tr style='border: 1px solid red; font-size: 1.2rem'>
		                                <td align='center' valign='top'>
		                                    <h3>You can respond to the tenant by directly replying to this email.</h3>
                                        <h3>View your ad on https://renthero.ca/${building.building_alias.replace(/ /g, '-')}</h3>
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


// generate the HTML email
function generateHTMLInquiryEmail_Tenant(tenant, message, building){
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
		                <tr style='background-color:#74a9d8'>
		                    <td align='center' valign='top'>
		                        <table border='0' cellpadding='20' cellspacing='0' width='100%' id='emailHeader'>
		                            <tr>
		                                <td align='center' valign='top'>
		                                    <img src='https://s3.amazonaws.com/${'rentburrow3-images'}/rentburrow_logo.png' style='width:150px; height: auto; margin: auto;' />
		                                </td>
		                            </tr>
		                        </table>
		                    </td>
		                </tr>
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
		                                    <h2>${tenant.first_name} ${tenant.last_name}</h2>
		                                    <h3>Your message has been sent to the landlord of ${building.building_address}</h3>
		                                </td>
		                            </tr>
		                            <tr style='border: 1px solid red; font-size: 1.2rem'>
		                                <td align='center' valign='top'>
		                                    <p>${message}</p>
		                                </td>
		                            </tr>
                                <tr style='border: 1px solid red; font-size: 1.2rem'>
		                                <td align='center' valign='top'>
		                                    <h3>You can speak with the landlord by directly replying to this email.</h3>
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
