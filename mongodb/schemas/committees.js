const mongoose = require("mongoose");

module.exports = {
    hfac: mongoose.model('hfac', {
        recordListTitle: {
            type: String,
            require: true
        },
        recordListTime: {
            type: String,
            require: true
        },
        recordListDate: {
            type: String,
            require: true
        },
        link: {
            type: String,
            require: true
        },
        witnesses: {
            type: Array,
            require: true
        }
    }),
    sfrc: mongoose.model('sfrc', {
        link: {
            type: String,
            require: true
        },
        date: {
            type: String,
            require: true
        },
        time: {
            type: String,
            require: true,
        },
        title: {
            type: String,
            require: true
        },
        location: {
            type: String,
            require: true
        },
        witnesses: {
            type: Array,
            require: true
        }
    }),
    ssev: mongoose.model('ssev', {
        link: {
            type: String,
            require: true
        },
        date: {
            type: String,
            require: true
        },
        time: {
            type: String,
            require: true
        },
        title: {
            type: String,
            require: true
        },
        location: {
            type: String,
            require: true
        },        
        witnesses: {
            type: Array,
            require: true
        }
    }),
};