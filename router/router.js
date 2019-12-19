const MessagingResponse = require('twilio').twiml.MessagingResponse;
const { escaper } = require("../util");
const { find } = require("../mongodb/methods/");
const { sfrc, hfac, ssev } = require("../mongodb/schemas/committees");
const moment = require("moment");
const axios = require("axios");

var appRouter = (app, db) => {
  
  const proPublicaApiOptions = { headers: { 'X-API-Key': process.env.PRO_PUBLICA }}; // Set options for Pro Publica API.
  
  const handleGetCommittees = async (memUri) => {
    let { data } = await axios.get(memUri, proPublicaApiOptions);
    let currentCommittees = data.results[0].roles.filter(role => role.congress == '116' )[0].committees; // .filter((mem) => mem.first_name.toLowerCase() === first && mem.last_name.toLowerCase() === last);
    return currentCommittees.length > 0 ? currentCommittees.map(committee => committee.code) : null
  };

  const handleGetUri = async (sms) => {
    let first = sms.split(" ")[0];
    let last = sms.split(" ")[1];
    let { data } = await axios.get("https://api.propublica.org/congress/v1/116/senate/members.json", proPublicaApiOptions);
    let memberData = data.results[0].members.filter((mem) => mem.first_name.toLowerCase() === first && mem.last_name.toLowerCase() === last);
    return memberData.length > 0 ? memberData[0].api_uri : null;
  };

  const handleNoDataFound = async (failMessage, res) => {
    const twiml = new MessagingResponse();
    twiml.message(failMessage);
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  };

  const parseData = (data) => {
    return JSON.stringify(data); /// This will eventually turn into a real parsing option...
  };

  const sendCommitteeData = async (successMessage, res) => {
    const twiml = new MessagingResponse();
    twiml.message(successMessage);
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
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
  }

  app.post("/sms", async(req,res) => {
    const msg = req.body;
    let { Body, From } = msg;
    let memUri = await handleGetUri(Body); // Get member's URI (url string)
    if (!memUri) {
      return handleNoDataFound('Sorry, that member could not be found.', res);
    };

    let memCommittees = await handleGetCommittees(memUri); // Get member's committee assignments (list)
    if (!memCommittees) {
      return handleNoDataFound('Sorry, that member does not appear to have any committee assignments.', res);
    };

    /// THIS IS ONLY HERE, the i === 0 thing, because we don't have the other committees set up yet.
    let committeeSchemas = handleGetCommitteeSchemas(memCommittees);
    let promises = committeeSchemas.map(async(committeeSchema, i) => i == 0 ? await getHearingSked(committeeSchema, moment().unix()) : Promise.resolve([])); // Get the schedule for each hearing.
    let hearingData = await Promise.all(promises);
    let totalHearings = hearingData.reduce((agg, committee) => {
      agg = agg + committee.length;
      return agg;
    }, 0);

    console.log(hearingData);
    console.log(totalHearings);
    
    if(totalHearings == 0){
      return handleNoDataFound('Sorry, that member does not appear to have any upcoming committees.', res);
    };
    
    let message = parseData(hearingData);
    sendCommitteeData(message, res);

  });
}

module.exports = appRouter;
