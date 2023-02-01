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

const webhookProxyUrl = config.ghCreds.smeeUrl; //local dev: using smee url for wehbook url testing
const source = new EventSource(webhookProxyUrl);

source.onmessage = (event) => {
  const issueEvent = JSON.parse(event.data);
  if (issueEvent.body.action == 'assigned'){
	let assignee = issueEvent.body.assignee.login;
	let assigner = issueEvent.body.sender.login;
	let issueTitle = issueEvent.body.issue.title;
	let issueNum = issueEvent.body.issue.number; 
	console.log(`New Issue: ${issueTitle}, Assigned To: ${assignee}, Assigned By: ${assigner}`);
	let brTitle = issueNum.toString()+' '+ issueTitle; //appending # bc dup branch names aren't allowed
	createBranch(brTitle);
  }
};

//making changes on branch

async function createBranch(brTitle) {
	try {
		brTitle = brTitle.replace(/\s+/g, '-').toLowerCase();
		const fetchRef = await octokit.request('GET /repos/{owner}/{repo}/git/ref/{ref}', {
		  owner: owner,
		  repo: repo,
		  ref: 'heads/master'
		});
		const createBranch = await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
		  owner: owner,
		  repo: repo,
		  ref: 'refs/heads/'+ brTitle,
		  sha: fetchRef.data.object.sha
		});
		console.log(`New Branch Created: ${createBranch.data.ref}`);
	} 
	catch (error) {
	  console.log(error);
	}
}
