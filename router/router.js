const MessagingResponse = require('twilio').twiml.MessagingResponse;
const { escaper } = require("../util");
const { find } = require("../mongodb/methods/");
const { sfrc, hfac, sasc } = require("../mongodb/schemas/committees");

const collPicker = (msg) => {
  let { Body, From } = msg;
  let database = (() => {
    switch(Body.toLowerCase()){
      case 'senate foreign relations committee':
        return sfrc
      case 'senate armed services committee':
        return sasc
      case 'house foreign relations committee':
        return hfac
      default:
        return null;
    };
  })();
    return database;
};

const fetchData = async (db) => {
  const data = await find(db);
  return data;
}

var appRouter = (app, db) => {
  app.get("/", (req, res) => {
    res.status(200)
      .send("You may have reached this page in error. Please contact Harrison Cramer, the national security correspondent at National Journal.");
  });

  app.post("/sms", async(req,res) => {

    const msg = req.body;
    let coll = collPicker(msg) ? collPicker(msg) : "Sorry, that information could not be found.";

    let response = await fetchData(coll);

    // Send escaped to original recipient...
    const twiml = new MessagingResponse();
    twiml.message(JSON.stringify(response));
    res.writeHead(200, {'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  });
}

module.exports = appRouter;
