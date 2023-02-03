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

source.onmessage = async (event) => {
	try {
	  event = JSON.parse(event.data);
	  let action = event.body.action;
	  if (event.body.hasOwnProperty("issue") && action == 'assigned'){
		const branchName = await prepareBranchName(event);
		createBranch(branchName); // to be createRef()?
	  }
	  if (event.body.hasOwnProperty("pull_request") && action == 'opened'){ // assigned:test, opened:actual
	  	linkIssueToPR(event);
	  }
	  if (event.body.hasOwnProperty("pull_request") && action == 'assigned'){ 
	  	// !!test tags endpoint in postman to see if we can use same function for tags and branches!!
	  	// getLatestTag()
	  	// tagBranch(getLatestTag) (createRef)
	  	tagBranch(event);
		}
	}
  	catch (error) {
	  console.log(error);
	}
};

function prepareBranchName(issueData){
	try {
		let issueNum = issueData.body.issue.number; 
		let brName = issueNum.toString()+' '+ issueData.body.issue.title; //appending # to link issues to prs and bc dup branch names aren't allowed
		brName = brName.replace(/\s+/g, '-').toLowerCase();
		console.log(`New Issue: ${issueData.body.issue.title}, Assigned To: ${issueData.body.assignee.login}, Assigned By: ${issueData.body.sender.login}`);
		return brName;
	}
	catch (error) {
	  console.log(error);
	}
};

async function tagBranch(e) {
	try {
		console.log(e);
		console.log(e.pull_request.merge_commit_sha);

		// const createTagObj = await octokit.request('POST /repos/{owner}/{repo}/git/tags/{tag}', {
		//   owner: owner,
		//   repo: repo,
		//   tag: '2.0.1' // to calculate based on tags?
		//   object: e.pull_request.merge_commit_sha
		//   type: 'commit'
		// });
		// const createTag = await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
		//   owner: owner,
		//   repo: repo,
		//   ref: 'refs/heads/'// + createTagObj.tag,
		//   sha: // createTagObj.sha
		// });
		// console.log(`Main Branch Tagged: ${createTag.data.ref}`);
	}
	catch (error) {
	  console.log(error);
	}
};

async function createBranch(brName) {
	try {
		// to test assign unassign and assign in same issue
		// to test assigning multiple people to issue
		// to test other characters: apostrophe, period or whatever
		// pending tests, to check whether branch exists first, then create branch
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
};

async function linkIssueToPR(pullReqData){
	try {
	  	let prBranchToMerge = pullReqData.body.pull_request.head.ref;
		let prBody = '[closes #' + prBranchToMerge.split('-')[0] + '] ';
		if (pullReqData.body.pull_request.body != null){
			prBody = prBody + pullReqData.body.pull_request.body;
		}
		const linkIssue = await octokit.request('PATCH /repos/{owner}/{repo}/pulls/{pull_number}', {
		  owner: owner,
		  repo: repo,
		  pull_number: pullReqData.body.number.toString(),
		  body: prBody
		});
		console.log(`PR desc updated with IssueNum to trigger auto-link: ${linkIssue.data.body}`);
	}
	catch (error) {
	  console.log(error);
	}
};
