const MessagingResponse = require('twilio').twiml.MessagingResponse;
const users = require("../mongodb/schemas/users");
const { sfrc, hfac, ssev } = require("../mongodb/schemas/committees");
const moment = require("moment");
const axios = require("axios");
const routeOne = require("./routes/routeOne.js");
const routeTwo = require("./routes/routeTwo.js");

var appRouter = (app, db) => {
  
  const findOrCreateUser = async ({ number, text }) => { // Newly created user will have lastRsp = 1;
    let query = { number };
    let update = { number, text };
    let options = { upsert: true, new: true, setDefaultsOnInsert: true };
    let result = await users.findOneAndUpdate(query, update, options); // function...
    return result
  };

  const handleRoute = async (From, res, user) => {       
    let { lastRsp, text, uriString } = user; // Some of these could be undefined...
    switch(lastRsp){
    	case 0:
	  await routeOne(text, From, res);
	  break;
	case 1:
	  await routeTwo(text, uriString, From, res);
	  break;
	default:
	  break;
    }
  };

  app.post("/sms", async(req,res) => {

    const msg = req.body;
    let { From, Body } = msg;
    From = From.replace(/[^0-9]/g, "");
    let user = await findOrCreateUser({ number: Number.parseInt(From), text: Body });
    await handleRoute(From, res, user);

  });
}

module.exports = appRouter;
