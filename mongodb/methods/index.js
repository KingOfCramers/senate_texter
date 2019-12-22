const users = require("../schemas/users");

module.exports = {
    find: async (Model) => {
        let data = await Model.find({});
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
