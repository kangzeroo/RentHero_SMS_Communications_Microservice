
exports.getLandlordInfo = function(building_id){
 const p = new Promise((res, rej) => {
   res({
     landlord_name: 'Jimmy The Tank',
     landlord_phone: '+16475286355'
   })
 })
 return p
}
