const { promptNextQuestion, handleNoDataFound } = require("./texts.js");
const { updateUri, updateLastRsp } = require("../../mongodb/methods/");
const axios = require("axios");

const proPublicaApiOptions = { headers: { 'X-API-Key': process.env.PRO_PUBLICA }}; // Set options for Pro Publica API.

const handleGetUri = async (memberName, chamber) => {
    let { data } = await axios.get(`https://api.propublica.org/congress/v1/116/${chamber}/members.json`, proPublicaApiOptions);
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
     
     let senateUri = await handleGetUri(memberName, 'senate');
     let houseUri = await handleGetUri(memberName, 'house');
     let results = senateUri || houseUri || null; // Assign uri to matching member, or null.
     return results
};

module.exports = async(textBody, From, res) => {
      let memUri = await handleGetMemberUri(textBody, res);
      if(!memUri){
        return handleNoDataFound("I'm sorry, we couldn't find that member. Are you using a nickname?", res); 
      } else {
        await updateUri(memUri, From);
        await updateLastRsp(1, From);  
        await promptNextQuestion("What would you like to know?\n1) Contact\n2) Committees\n3)Voting Record", res);
      }
};
