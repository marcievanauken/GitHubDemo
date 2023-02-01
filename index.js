// const core = require('@actions/core');
// const github = require('@actions/github');
const { Octokit } = require("@octokit/rest");
const { Webhooks, createNodeMiddleware } = require("@octokit/webhooks");
const EventSource = require('eventsource'); // local dev: watches for an event from the URL source (webhook url)
const config = require('./config.js');
const owner = config.ghCreds.owner;
const repo = config.ghCreds.repo;

const webhooks = new Webhooks({
  secret: "mva-secret-052387",
});

const octokit = new Octokit({
    auth: config.ghCreds.accessToken
});

const webhookProxyUrl = "https://smee.io/oQVZEiZC5N9juPAH"; //local dev to read event payload
const source = new EventSource(webhookProxyUrl);
source.onmessage = (event) => {
  const webhookEvent = JSON.parse(event.data);
  if (webhookEvent.body.action == 'assigned'){
  	createBranch(webhookEvent.body)
  }
};

async function createBranch(payload) {
	try {
		console.log("createBranch")
		console.log(payload.issue.title)
		// var issueTitle = '';
		// if (github.context.payload.hasOwnProperty("issue")){
		// 	issueTitle = github.context.payload.issue.title;
		// 	issueTitle = issueTitle.replace(/\s+/g, '-').toLowerCase();
		// } else {
		// 	issueTitle = new Date().getTime();
		// }
		// const fetchRef = await octokit.request('GET /repos/{owner}/{repo}/git/ref/{ref}', {
		//   owner: owner,
		//   repo: repo,
		//   ref: 'heads/master'
		// });
		// const createBranch = await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
		//   owner: owner,
		//   repo: repo,
		//   ref: 'refs/heads/'+ issueTitle,
		//   sha: fetchRef.data.object.sha
		// });
		// console.log(createBranch)
	} 
	catch (error) {
	  core.setFailed(error.message);
	}
}

// createBranch();


// creating custom action old code
var usingGitHub = false;
if (usingGitHub){
	try {
	  // `who-to-greet` input defined in action metadata file
	  const nameToGreet = core.getInput('who-to-greet');
	  console.log(`Hello ${nameToGreet}!`);
	  const time = (new Date()).toTimeString();
	  core.setOutput("time", time);
	  // Get the JSON webhook payload for the event that triggered the workflow
	  const payload = JSON.stringify(github.context.payload, undefined, 2)
	  // console.log(`The event payload: ${payload}`);
	  console.log('HEEEREEEEEEEE');
	  console.log(github.context.payload.issue.title) // issue event
	  console.log('HEEEREEEEEEEE');
	} 
	catch (error) {
	  core.setFailed(error.message);
	}
}
