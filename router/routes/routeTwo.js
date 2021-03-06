const { promptNextQuestion, handleNoDataFound } = require("./texts.js");
const { updateLastRsp } = require("../../mongodb/methods/");
const axios = require("axios");

const proPublicaApiOptions = { headers: { 'X-API-Key': process.env.PRO_PUBLICA }}; // Set options for Pro Publica API.

const handleGetContactInfo = async (uri) => {
  let { data } = await axios.get(uri, proPublicaApiOptions);
  if(data.results.length > 0){
    let currentRole = data.results[0].roles.filter(role => role.congress == "116");
    let { office, phone, fax } = currentRole[0];
    let { twitter_account } = data.results[0];
    let results = `${office}\n Phone: ${phone}\n Twitter: ${twitter_account}\n Fax: ${fax}`;
	  return results
  } else {
    return "We could not find the contact info."
  };
};

const handleGetCommittees = async (uri) => {
  let { data } = await axios.get(uri, proPublicaApiOptions);
  
  // Get committees and subcommittees...
  let committees = data.results[0].roles.filter(role => role.congress == '116' )[0].committees;
  let subcommittees = data.results[0].roles.filter(role => role.congress == '116' )[0].subcommittees;
  
  // Nest subcommittees under committee names.
  let filteredCommittees = committees.reduce((agg, committee) => {
    let code = committee.code;
    let relevantSubcommittees = subcommittees.filter((sub) => sub.parent_committee_id === code);
    agg.push({ committee, subcommittees: relevantSubcommittees, });
    return agg;
}, []).map(data => {
    let committeeName = data.committee.name;
    let committeePosition = data.committee.title !== "Member" ? data.committee.title : null;
    let subcommitteeData = data.subcommittees.map(data => ({ name: data.name, title: data.title !== "Member" ? data.title : null }));
    return ({ committeeName, committeePosition, subcommitteeData });
  });

  let string = filteredCommittees.reduce((agg, data) => {
    agg = agg.concat(`${data.committeeName} `);
    if(data.committeePosition){
        agg = agg.concat(`(${data.committeePosition}) `)
    };
    agg = agg.concat("\n");

    if(data.subcommitteeData.length > 0){
        agg = agg.concat(`Subcommittees: `)
        data.subcommitteeData.forEach((sub) => {
            agg = agg.concat(`${sub.name.replace(" Subcommittee", "")}`);
            if(!!sub.title){ // This is wrong.
                agg = agg.concat(` (${sub.title}); `);
            } else {
                agg = agg.concat(`; `);
            }
        });
        agg = agg.concat("\n\n")
    };
    return agg;
  }, '');

  return string;
};

const handleGetVotingRecord = async(uri) => {
  let { data } = await axios.get(uri, proPublicaApiOptions);
  if(data.results.length > 0){
    let currentRole = data.results[0].roles.filter(role => role.congress == "116");
    let { total_votes, missed_votes, bills_sponsored, bills_cosponsored, votes_against_party_pct, missed_votes_pct } = currentRole[0];
    let results = `Total Votes: ${total_votes}\n Missed Votes: ${missed_votes}\n Bills Sponsored: ${bills_sponsored}\n Bills Cosponsored: ${bills_cosponsored}\n Votes Against Party: ${votes_against_party_pct}%\n Missed Votes: ${missed_votes_pct}%`;
	  return results;
  } else {
    return "We could not find that member's voting record."
  };
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
    case "voting record":
    case "voting":
    case "record":
    case "votes":
      let record = await handleGetVotingRecord(uriString);
      return record;
	  default:
		  return null;
	}
};

module.exports = async(text, user, From, res) => {
      let data = await chooseQuery(text, user, From);
      data = data.concat("\nType the name of another lawmaker to get new information.")
      if(!data){
        await handleNoDataFound("I'm not able to find that information. Type the name of a lawmaker to try again.", res);
        await updateLastRsp(0, From);  
      } else {
        await promptNextQuestion(data, res);
        await updateLastRsp(0, From);
      }
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
