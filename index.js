require("dotenv").config({ path: "./.env" });

const express = require("express");
const bodyParser = require("body-parser");
const router = require("./router/router.js");
const client = require("twilio")(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const mongoose = require("mongoose");

const app = express();

const connectToMongoDB = async () => {
	try {
		await mongoose.connect("mongodb://localhost:27017/committees", { useNewUrlParser: true, useUnifiedTopology: true });
    } catch(err){
		console.log(err);
        throw Error // return logger.error(`Could not connect to database. `, err);
    };
}

const setup = async () => {
	await connectToMongoDB();
		
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));

	router(app);

	const server = app.listen(3000, () => {
		console.log("App running on port 3000.");
	});
};

setup();

// setTimeout(() => {
//   client.messages.create({
// 	  body: 'This is a message.',
// 	  from: '4133155077',
// 	  to: '6179973703'
//   }).then(message => console.log(message.sid));
// }, 450)
