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
  let action = event.body.action;
  if (event.body.hasOwnProperty("issue") && action == 'assigned'){ //refactor this somehow
	prepareBranchName(event);
  }
  if (event.body.hasOwnProperty("pull_request") && action == 'assigned'){ // test use assigned, else opened
  	linkIssueToPR(event);
  }
  if (event.body.hasOwnProperty("pull_request") && action == 'closed'){ 
  	console.log(event)
  }
};

async function prepareBranchName(issueData){
	let issueNum = issueData.body.issue.number; 
	let brName = issueNum.toString()+' '+ issueData.body.issue.title; //appending # bc dup branch names aren't allowed and is needed for linking issues to prs
	console.log(`New Issue: ${issueData.body.issue.title}, Assigned To: ${issueData.body.assignee.login}, Assigned By: ${issueData.body.sender.login}`);
	createBranch(brName); // to return brName, and send to createBranch async await
}

async function createBranch(brName) { //change to createRef (to handle new branch ref and tag ref (refs/tags/[tag]) --> pass ref paths and other needed info here)
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

async function linkIssueToPR(pullReqData){
	console.log(pullReqData)
	// let prData = {};
 //  	let prBranchToMerge = event.body.pull_request.head.ref;
 //  	prData.prNum = event.body.number.toString();
 //  	prData.issueToLink = prBranchToMerge.split('-')[0];
 //  	prData.prDesc = event.body.pull_request.body;

	// let prBody = '[closes #' + prData.issueToLink + '] ';
	// if (prData.prDesc != null){
	// 	prBody = prBody + prData.prDesc;
	// }
	// const linkIssue = await octokit.request('PATCH /repos/{owner}/{repo}/pulls/{pull_number}', {
	//   owner: owner,
	//   repo: repo,
	//   pull_number: prData.prNum,
	//   body: prBody
	// });
	// console.log(`PR desc updated with Issue to auto-link: ${linkIssue.data.body}`);
}
