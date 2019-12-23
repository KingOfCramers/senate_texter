const { promptNextQuestion, handleNoDataFound } = require("./texts.js");
const { updateLastRsp } = require("../../mongodb/methods/");
const axios = require("axios");

const proPublicaApiOptions = { headers: { 'X-API-Key': process.env.PRO_PUBLICA }}; // Set options for Pro Publica API.

const handleGetContactInfo = async (uri) => {
  let { data } = await axios.get(uri, proPublicaApiOptions);
  if(data.results.length > 0){
    let currentRole = data.results[0].roles.filter(role => role.congress == "116");
    let { office, phone, fax } = currentRole[0];
    let results = `${office}\n Phone: ${phone}\n Fax: ${fax}`;
	  return results
  } else {
    return "We could not find the contact info."
  };
};


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

const handleGetCommittees = async (memUri) => {
  let { data } = await axios.get(memUri, proPublicaApiOptions);
  
  // Get committees, return a string..
  let currentCommittees = data.results[0].roles.filter(role => role.congress == '116' )[0].committees;
  let committeeNames = currentCommittees.length > 0 ? currentCommittees.map(committee => committee.title !== "Member" ? committee.name.concat(` (${committee.title})`) : committee.name).join("\n") : null;
  
  // Get subcommittee api uri string,
  let currentSubcommittees = data.results[0].roles.filter(role => role.congress == '116' )[0].subcommittees;
  if(currentSubcommittees.length > 0){
    let promises = currentSubcommittees.map(async(sub) => await axios.get(sub.api_uri, proPublicaApiOptions));
    let subcommitteeData = await Promise.all(promises) // For each string, determine full name, return it w/ subcommittee name.
    let subcommitteeNames = subcommitteeData.map(({ data }) => {
      let committeeName = data.results[0].committee_name;
      let subcommitteeName = data.results[0].name;
      return `${committeeName} (${subcommitteeName} Subcommittee)`;
    }).join("\n");
    committeeNames = committeeNames.concat(`\n ${subcommitteeNames}`);
  };
  return committeeNames;
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

const chooseQuery = async(text, uriString, From, res) => {
  switch(text.toLowerCase()){
    case "contact":
    case "contact info":
    case "phone":
    case "phone number":
    case "contact information":
    case "office":
		  let contact = await handleGetContactInfo(uriString);
		  return contact;
	  case "committees":
    case "committtee":
    case "committee assignments":
      let committees = await handleGetCommittees(uriString)
		  return committees;
	  default:
		  return null;
	}
};

module.exports = async(text, user, From, res) => {
      let data = await chooseQuery(text, user, From);
      if(!data){
        await handleNoDataFound("I'm not able to find that information.", res);
        await updateLastRsp(0, From);  
      } else {
        await promptNextQuestion(data, res);
        await updateLastRsp(0, From);
      }
};
