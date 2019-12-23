const { promptNextQuestion, handleNoDataFound } = require("./texts.js");
const { updateLastRsp } = require("../../mongodb/methods/");
const axios = require("axios");
const { replacer } = require("../../util");

const proPublicaApiOptions = { headers: { 'X-API-Key': process.env.PRO_PUBLICA }}; // Set options for Pro Publica API.

const handleGetContactInfo = async (uri) => {
  let { data } = await axios.get(uri, proPublicaApiOptions);
  if(data.results.length > 0){
    let currentRole = data.results[0].roles.filter(role => role.congress == "116");
    let { office, phone, fax } = currentRole[0];
    let results = `Office: ${office}\n Phone: ${phone}\n Fax: ${fax}`;
	  return results
  } else {
    return "We could not find the contact info."
  };
};

const chooseQuery = async(text, uriString, From, res) => {
	switch(text){
	  case "contact":
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
        return handleNoDataFound('That is not a valid query.', res);
      } else {
        await updateLastRsp(1, From);  
        await promptNextQuestion(data, res);
      }
};
