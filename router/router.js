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


  const handleGetCommittees = async (memUri) => {
    let { data } = await axios.get(memUri, proPublicaApiOptions);
    let currentCommittees = data.results[0].roles.filter(role => role.congress == '116' )[0].committees; // .filter((mem) => mem.first_name.toLowerCase() === first && mem.last_name.toLowerCase() === last);
    return currentCommittees.length > 0 ? currentCommittees.map(committee => committee.code) : null
  };

  const parseData = (data) => {
    return JSON.stringify(data); /// This will eventually turn into a real parsing option...
  };

  const getHearingSked = async (committeeSchema, theDate) => {
    let hearings = await find(committeeSchema);
    hearings = hearings.map(hearing => ({ compare: moment(`${hearing.date} ${hearing.time}`).unix(), ...hearing }));
    let newHearings = hearings.filter(hearing => hearing.compare > theDate);
    return newHearings;
  };

  const handleGetCommitteeSchemas = (committees) => {
    return committees.map(committee => {
      switch(committee.toLowerCase()){
        case 'ssev':
          return ssev;
          /// And so on and so forth for all the committees...          
      }
    });
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

    //  let memCommittees = await handleGetCommittees(memUri); // Get member's committee assignments (list)
    //  if (!memCommittees) {
    //    return handleNoDataFound('Sorry, that member does not appear to have any committee assignments.', res);
    //  };

    //  /// THIS IS ONLY HERE, the i === 0 thing, because we don't have the other committees set up yet.
    //  let committeeSchemas = handleGetCommitteeSchemas(memCommittees);
    //  let promises = committeeSchemas.map(async(committeeSchema, i) => i == 0 ? await getHearingSked(committeeSchema, moment().unix()) : Promise.resolve([])); // Get the schedule for each hearing.
    //  let hearingData = await Promise.all(promises);
    //  let totalHearings = hearingData.reduce((agg, committee) => {
    //    agg = agg + committee.length;
    //    return agg;
    //  }, 0);
    
    //  if(totalHearings == 0){
    //    return handleNoDataFound('Sorry, that member does not appear to have any upcoming committees.', res);
    //  };
    
    //  let finalResponse = parseData(hearingData);
    //  sendCommitteeData(finalResponse, res);

  });
}

module.exports = appRouter;
