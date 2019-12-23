const { promptNextQuestion, handleNoDataFound } = require("./texts.js");
const { find, updateUri, updateLastRsp } = require("../../mongodb/methods/");
const axios = require("axios");


  const proPublicaApiOptions = { headers: { 'X-API-Key': process.env.PRO_PUBLICA }}; // Set options for Pro Publica API.

const handleGetUri = async (memberName) => {
    let { data } = await axios.get("https://api.propublica.org/congress/v1/116/senate/members.json", proPublicaApiOptions);
    let memberData = data.results[0].members.filter((mem) => mem.first_name.toLowerCase() === memberName[0] && mem.last_name.toLowerCase() === memberName[1]);
    return memberData.length > 0 ? memberData[0].api_uri : null;
};

  const parseName = (message) => {
    if(message.split(" ").length !== 2){
      return null;
    }

    let name = message.split(" ").map(name => name.toLowerCase());
    return name;
  };

const handleGetMemberUri = async(textBody, res) => {
     let memberName = await parseName(textBody);
     if(!memberName){
	     return null;
     };
     
     let memUri = await handleGetUri(memberName); // Get member's URI (url string)
     if(!memUri){
     	return null;
     }
     return memUri;
};

module.exports = async(textBody, From, res) => {
      let memUri = await handleGetMemberUri(textBody, res);
      console.log(memUri);
      if(!memUri){
        return handleNoDataFound('Please enter a first and last name.', res);
      } else {
        await updateUri(memUri, From);
        await updateLastRsp(1, From);  
        await promptNextQuestion("What would you like to know?", res);
      }
};
