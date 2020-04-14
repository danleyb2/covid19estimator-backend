var mongoose = require('mongoose');


var Schema = mongoose.Schema;


var LogSchema = Schema({

    method: {type: String, required: true, enum:['POST', 'GET'], default:'GET'},
    path: {type: String, required: true},
    status: {type: Number, required: true},
    time: {type: Number, required: true}


}, {timestamps: true});



module.exports = mongoose.model('Log', LogSchema);
