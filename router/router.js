const MessagingResponse = require('twilio').twiml.MessagingResponse;
const { find, updateUri, updateLastRsp } = require("../mongodb/methods/");
const users = require("../mongodb/schemas/users");
const { sfrc, hfac, ssev } = require("../mongodb/schemas/committees");
const moment = require("moment");
const axios = require("axios");

var appRouter = (app, db) => {
  
  const proPublicaApiOptions = { headers: { 'X-API-Key': process.env.PRO_PUBLICA }}; // Set options for Pro Publica API.
  
  const promptNextQuestion = async (successMessage, res) => {
    const twiml = new MessagingResponse();
    twiml.message(successMessage);
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  };

  const handleNoDataFound = async (failMessage, res) => {
    const twiml = new MessagingResponse();
    twiml.message(failMessage);
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  };


  const findOrCreateUser = async ({ number, text }) => { // Newly created user will have lastRsp = 1;
    let query = { number };
    let update = { number, text };
    let options = { upsert: true, new: true, setDefaultsOnInsert: true };
    let result = await users.findOneAndUpdate(query, update, options); // function...
    return result
  };

  const parseName = (message) => {
    if(message.split(" ").length !== 2){
      return null;
    }

    let name = message.split(" ").map(name => name.toLowerCase());
    return name;
  };

  const handleGetUri = async (memberName) => {
    let { data } = await axios.get("https://api.propublica.org/congress/v1/116/senate/members.json", proPublicaApiOptions);
    let memberData = data.results[0].members.filter((mem) => mem.first_name.toLowerCase() === memberName[0] && mem.last_name.toLowerCase() === memberName[1]);
    return memberData.length > 0 ? memberData[0].api_uri : null;
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

  const handleGetMemberUri = async(textBody, res) => {
     let memberName = await parseName(textBody);
     if(!memberName){
	     return null;
     };
     
     let memUri = await handleGetUri(memberName); // Get member's URI (url string)
     if (!memUri) {
	     return null;
     };
     
     return memUri;
  };

	const handleUpdateUserUri = async(uri, from) => {
	  await updateUri(uri, from);
	};

	const handleIterateUserLastRsp = async(num, from) => {
	  await updateLastRsp(num, from); 
	};

  const handleRoute = async (lastRsp, textBody, From, res) => {
    if(lastRsp == 0){
      let memUri = await handleGetMemberUri(textBody, res);
      if(!memUri){
        return handleNoDataFound('Please enter a first and last name.', res);
      } else {
        await handleUpdateUserUri(memUri, From);
        await handleIterateUserLastRsp(1, From);  
        await promptNextQuestion("What would you like to know?", res);
      }
    };
  };

  app.post("/sms", async(req,res) => {

    const msg = req.body;
    let { Body, From } = msg;
     
    From = From.replace(/[^0-9]/g, "");
    
    let user = await findOrCreateUser({ number: Number.parseInt(From), text: Body });
    let { lastRsp, textBody } = user;
    await handleRoute(lastRsp, Body, From, res);

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
