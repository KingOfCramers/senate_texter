const MessagingResponse = require('twilio').twiml.MessagingResponse;
const { escaper } = require("../util");
const { find } = require("../mongodb/methods/");
const { sfrc, hfac, sasc } = require("../mongodb/schemas/committees");
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

  const getHearingSked = async (id, theDate) => {
    console.log(id, theDate);
    return 'ok';
  };

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

    let promises = memCommittees.map(async(id) => await getHearingSked(id, moment().format('llll'))); // Get the schedule for each hearing.
    Promise.all(promises)
      .then(results => {
        if(results.length > 0){
          console.log(results);
        } else {
          handleNoDataFound('Sorry, that member does not appear to have any hearings coming up.', res);
        }
      })
      .catch(err => {
        handleNoDataFound('Sorry, something went wrong with our server.', res);
      });
  });
}

module.exports = appRouter;
