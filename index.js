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
  if (event.body.hasOwnProperty("issue") && event.body.action == 'assigned'){
	issueAssigned(event);
  }
  if (event.body.hasOwnProperty("pull_request") && event.body.action == 'assigned'){ //&& event.body.action == 'opened'
  	let prData = {};
  	let prBranchToMerge = event.body.pull_request.head.ref;
  	prData.prNum = event.body.number.toString();
  	prData.issueToLink = prBranchToMerge.split('-')[0];
  	prData.prDesc = event.body.pull_request.body;
  	linkIssueToPR(prData);
  }
};

async function linkIssueToPR(prData){
	console.log(prData);
	const linkIssue = await octokit.request('PATCH /repos/{owner}/{repo}/pulls/{pull_number}', {
	  owner: owner,
	  repo: repo,
	  pull_number: prData.prNum,
	  body: 'closes #' + prData.issueToLink + ' || ' + prData.prDesc
	});
	console.log(`Issue Linked: ${linkIssue.data.body}`);

}

async function issueAssigned(issueData){
	let assignee = issueData.body.assignee.login;
	let assigner = issueData.body.sender.login;
	let issueTitle = issueData.body.issue.title;
	let issueNum = issueData.body.issue.number; 
	console.log(`New Issue: ${issueTitle}, Assigned To: ${assignee}, Assigned By: ${assigner}`);
	let brName = issueNum.toString()+' '+ issueTitle; //appending # bc dup branch names aren't allowed and is needed for linking issues to prs
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
