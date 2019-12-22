const mongoose = require("mongoose");

module.exports = mongoose.model('user', {
    number: {
        type: Number,
        require: true,
        default: 0
    },
    text: {
        type: String,
        require: false,
        default: "",
    },
    lastRsp: {
        type: Number,
        require: false,
        default: 0 
    }
});
