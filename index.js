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
			createBranch(branchName);
			// create getRef function, use sha as input from createBranch return
	  }
	  if (event.body.hasOwnProperty("pull_request") && action == 'opened'){ // assigned:test, opened:actual
	  	linkIssueToPR(event);
	  }
	  if (event.body.hasOwnProperty("pull_request") && action == 'closed'){ 
	  	// prepareTag() 
	  	tagBranch(event); // inputs: (pr merge event sha, generated v tag (1.0.1))
	  	// create getRef function, use sha as input from tagBranch return

	  }
	}
  	catch (error) {
	  console.log(error);
	}
};

function prepareBranchName(issueData){
	try {
		let issueNum = issueData.body.issue.number;
		let assignee =  issueData.body.assignee.login;
		assignee = assignee.slice(0,3);
		let brName = issueNum.toString()+'-'+assignee+'-'+issueData.body.issue.title; //dup branches not allowed, appending name in case we have multiple assignees to an issue, appending # to link issues to prs
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
		const createTagObj = await octokit.request('POST /repos/{owner}/{repo}/git/tags', {
		  owner: owner,
		  repo: repo,
		  tag: '1.0.0', // to be variable - calculated based on labels?
		  message: 'tag main branch',
		  object: e.body.pull_request.merge_commit_sha, //can use fetchRef.data.object.sha, safer to use PR payload sha
		  type: 'commit'
		});


		const createTag = await createRef('refs/tags/1.0.0', createTagObj.data.object.sha);
		// const createTag = await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
		//   owner: owner,
		//   repo: repo,
		//   ref: 'refs/tags/1.0.0', // to be variable
		//   sha: createTagObj.data.object.sha
		// });
		console.log(`Tagging Result: ${createTag}`);
	}
	catch (error) {
	  console.log(error.response.data.message); //reference already exists
	}
};

async function createBranch(brName) {
	try {
		// to discuss checkBranch() for dups (we can have catch handle it but then we call unecessary methods)
		const fetchRef = await octokit.request('GET /repos/{owner}/{repo}/git/ref/{ref}', {
		  owner: owner,
		  repo: repo,
		  ref: 'heads/master'
		});
		const createBranch = await createRef('refs/heads/'+ brName, fetchRef.data.object.sha);
		console.log(`Branching Result: ${createBranch}`);
	}
	catch (error) {
	  console.log(`Error Msg: ${error.response.data.message}, Error Info: ${error.request.body}`);
	}
};

async function createRef(ref, sha){
	try {
		const newRef = await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
		  owner: owner,
		  repo: repo,
		  ref: ref,
		  sha: sha
		});
		return newRef.data.ref
	}
	catch (error) {
		return `Error Msg: ${error.response.data.message}, Error Info: ${error.request.body}` //reference already exists, not a valid ref name (period at end of issue title)
	}
}

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
