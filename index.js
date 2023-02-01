const { Octokit } = require("@octokit/rest");
const { Webhooks, createNodeMiddleware } = require("@octokit/webhooks");
const EventSource = require('eventsource'); // local dev: watches for an event from the URL source (webhook url)
const config = require('./config.js');
const owner = config.ghCreds.owner;
const repo = config.ghCreds.repo;

const octokit = new Octokit({
    auth: config.ghCreds.accessToken
});

const webhooks = new Webhooks({
  secret: config.ghCreds.secret,
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
	  console.log(error);
	}
}
