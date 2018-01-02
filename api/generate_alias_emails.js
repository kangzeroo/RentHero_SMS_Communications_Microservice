const shortid = require('shortid')

exports.generateTenantAliasEmail = function(first_name, last_name) {
  const strippedName = `${first_name}.${last_name}`.replace(/[^a-zA-Z0-9-_]/g, '')
  return `${strippedName}.${shortid.generate()}@renthero.cc`
}

// exports.generateLandlordAliasEmail = function(corporation_name) {
//    // but what if the corporation name changes?
//   const strippedName = corporation_name.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(' ', '.')
//   return `${strippedName}@renthero.cc`
// }
