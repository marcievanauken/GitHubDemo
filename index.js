const { Octokit } = require("@octokit/rest");
const { Webhooks, createNodeMiddleware } = require("@octokit/webhooks");
const EventSource = require('eventsource'); // watches for an event from the URL source (webhook url)
const config = require('./config.js');
const owner = config.ghCreds.owner;
const repo = config.ghCreds.repo;

const octokit = new Octokit({
    auth: config.ghCreds.accessToken
});

const webhooks = new Webhooks({
  secret: config.ghCreds.secret,
});

//local dev resource used: https://github.com/octokit/webhooks.js/
const webhookProxyUrl = config.ghCreds.smeeUrl; //local dev: using smee for wehbook proxy url
const source = new EventSource(webhookProxyUrl);

source.onmessage = (event) => {
  event = JSON.parse(event.data);
  console.log(event)

  if (event.body.hasOwnProperty("issue") && event.body.action == 'assigned'){
	issueAssigned(event);
  }
  if (event.body.hasOwnProperty("pull_request")){ //&& event.body.action == 'opened'
  	console.log(event.body.pull_request.head);
  	// console.log(event.body.pull_request.head.ref);
  	let prBranchToMerge = event.body.pull_request.head.ref;
  	console.log(prBranchToMerge)
  	// console.log(JSON.stringify(event.body.pull_request.base));
  }
};

async function issueAssigned(e){
	let assignee = e.body.assignee.login;
	let assigner = e.body.sender.login;
	let issueTitle = e.body.issue.title;
	let issueNum = e.body.issue.number; 
	console.log(`New Issue: ${issueTitle}, Assigned To: ${assignee}, Assigned By: ${assigner}`);
	let brName = issueNum.toString()+' '+ issueTitle; //appending # bc dup branch names aren't allowed and is helpful for linking issues to prs
	if (config.ghCreds.createBranch) createBranch(brName);
}

//changing

async function createBranch(brName) {
	try {
		// if we assign multiple people, unassign, or reassign, we will try to create the branch again
		// to check whether branch exists first, then create branch
		brName = brName.replace(/\s+/g, '-').toLowerCase();
		const fetchRef = await octokit.request('GET /repos/{owner}/{repo}/git/ref/{ref}', {
		  owner: owner,
		  repo: repo,
		  ref: 'heads/master'
		});
		const createBranch = await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
		  owner: owner,
		  repo: repo,
		  ref: 'refs/heads/'+ brName,
		  sha: fetchRef.data.object.sha
		});
		console.log(`New Branch Created: ${createBranch.data.ref}`);
	} 
	catch (error) {
	  console.log(error);
	}
}
