const MessagingResponse = require('twilio').twiml.MessagingResponse;

module.exports = {
	promptNextQuestion: async (successMessage, res) => {
		const twiml = new MessagingResponse();
		twiml.message(successMessage);
		res.writeHead(200, { 'Content-Type': 'text/xml' });
		res.end(twiml.toString());
	},
	handleNoDataFound: async (failMessage, res) => {
		const twiml = new MessagingResponse();
		twiml.message(failMessage);
		res.writeHead(200, { 'Content-Type': 'text/xml' });
		res.end(twiml.toString());
	},
};
