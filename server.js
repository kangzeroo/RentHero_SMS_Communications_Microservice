const express = require('express')
const http = require('http')
const https = require('https')
const fs = require('fs')
const morgan = require('morgan')
const router = require('./router')
const cors = require('cors')

const app = express()
require('./twilio_setup')

// const createTables = require('./message_logs/schema/communications_history/communications_history_table').createTables
// createTables()
// Database setup

// App setup
// morgan and bodyParser are middlewares. any incoming requests will be passed through each
// morgan is a logging framework to see incoming requests. used mostly for debugging
app.use(morgan('tiny'));
// CORS middleware (cross origin resource sharing) to configure what domain & ips can talk to our server api
// CORS is used for user security on web browsers. Enable CORS on server to allow all I.P. addresses
app.use(cors());

// we instantiate the router function that defines all our HTTP route endpoints
router(app);
const port = process.env.PORT || 3006

// Server setup
// if there is an environment variable of PORT already defined, use it. otherwise use port 3002
if (process.env.NODE_ENV === 'production') {
  const options = {
      ca: fs.readFileSync('./credentials/rentburrow_com.ca-bundle'),
      key: fs.readFileSync('./credentials/rentburrow_com.key'),
      cert: fs.readFileSync('./credentials/rentburrow_com.crt'),
      requestCert: false,
      rejectUnauthorized: false
  }
  const server = https.createServer(options, app)
  // listen to the server on port
  server.listen(port, function(){
    console.log("Server listening on https: ", port)
  })
} else if (process.env.NODE_ENV === 'twilio') {
  const server = http.createServer(app)
  server.listen(port, function(){
    console.log("Server listening on http: ", port)
  })
} else if (process.env.NODE_ENV === 'staging') {
  const lex = require('greenlock-express').create({
    server: 'https://acme-v01.api.letsencrypt.org/directory',
    approveDomains: (opts, certs, cb) => {
      if (certs) {
        // change domain list here
        opts.domains = ['ec2-34-227-117-38.compute-1.amazonaws.com']
      } else {
        // change default email to accept agreement
        opts.email = 'email.records.rentburrow@gmail.com';
        opts.agreeTos = true;
      }
      cb(null, { options: opts, certs: certs });
    }
  })
  const middlewareWrapper = lex.middleware
  const server = https.createServer(lex.httpsOptions, app.use(middlewareWrapper))
  // listen to the server on port
  server.listen(port, function(){
    console.log("Server listening on https: ", port)
  })
} else {
  const options = {
      ca: fs.readFileSync('./credentials/rentburrow_com.ca-bundle'),
      key: fs.readFileSync('./credentials/rentburrow_com.key'),
      cert: fs.readFileSync('./credentials/rentburrow_com.crt'),
      requestCert: false,
      rejectUnauthorized: false
  }
  const server = https.createServer(options, app)
  // listen to the server on port
  server.listen(port, function(){
    console.log("Server listening on https: ", port)
  })
}


// create a server with the native node https library

// if (process.env.NODE_ENV === 'production') {
//   // instantiate the SSL certificate necessary for HTTPS
  // const options = {
  //     ca: fs.readFileSync('./credentials/rentburrow_com.ca-bundle'),
  //     key: fs.readFileSync('./credentials/rentburrow_com.key'),
  //     cert: fs.readFileSync('./credentials/rentburrow_com.crt'),
  //     requestCert: false,
  //     rejectUnauthorized: false
  // }
  // const server = https.createServer(options, app)
  // // listen to the server on port
  // server.listen(port, function(){
  //   console.log("Server listening on https: ", port)
  // })
// } else {
//   // instantiate the SSL certificate necessary for HTTPS
//   const options = {
//       // ca: fs.readFileSync('./credentials/rentburrow_com.ca-bundle'),
//       key: fs.readFileSync('./credentials/rentburrow_com.key'),
//       cert: fs.readFileSync('./credentials/rentburrow_com.crt'),
//       requestCert: false,
//       rejectUnauthorized: false
//   }
//   const server = https.createServer(options, app)
//   // listen to the server on port
//   server.listen(port, function(){
//     console.log("Server listening on https: ", port)
//   })
// }
