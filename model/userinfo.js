const mongoose = require('mongoose');

const schema = mongoose.Schema({
    name: String,
    surname: String,
    addess: String,
    subaddress: String,
    state: String,
    pincode: String
});

const userinfo = mongoose.model('userinfo', schema);
module.exports = userinfo;