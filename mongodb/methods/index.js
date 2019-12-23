const users = require("../schemas/users");

module.exports = {
    findByNum: async (number) => {
        let data = await Model.find({ number: number });
        data = data.map(datum => datum.toObject());
        return data;
    },
    updateUri: async (uri, from) => {
	    await users.findOneAndUpdate({ number: from}, { uriString: uri}); 
    },
    updateLastRsp: async(num, from) => {
	    await users.findOneAndUpdate({ number: from }, { $inc: { lastRsp: num }});
    }
}
