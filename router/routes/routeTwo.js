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
		  return null;
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
        await updateLastRsp(0, From);  
        await promptNextQuestion(data, res);
      }
};
