const core = require('@actions/core');
const github = require('@actions/github');
const { Octokit } = require("@octokit/rest");
const config = require('./config.js');


const octokit = new Octokit({
    auth: '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'
});

var usingGitHub = false;
const owner = 'marcievanauken';
const repo = 'GitHubDemo';


if (usingGitHub){
	try {
	  // `who-to-greet` input defined in action metadata file
	  const nameToGreet = core.getInput('who-to-greet');
	  console.log(`Hello ${nameToGreet}!`);
	  const time = (new Date()).toTimeString();
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


async function createBranch() {
	try {

		var issueTitle = '';
		if (github.context.payload.hasOwnProperty("issue")){
			issueTitle = github.context.payload.issue.title;
			issueTitle = issueTitle.replace(/\s+/g, '-').toLowerCase();
		} else {
			issueTitle = new Date().getTime();
		}
		
		console.log("!!!!!!!!!issueTitle!!!!!!!!!!")
		console.log(issueTitle)
		const fetchRef = await octokit.request('GET /repos/{owner}/{repo}/git/ref/{ref}', {
		  owner: owner,
		  repo: repo,
		  ref: 'heads/master'
		});

		const createBranch = await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
		  owner: owner,
		  repo: repo,
		  ref: 'refs/heads/'+ issueTitle,
		  sha: fetchRef.data.object.sha
		});
		console.log(createBranch)
	} 
	catch (error) {
	  core.setFailed(error.message);
	}
}

createBranch();



// if (usingGitHub){
// 	try {
// 	  // `who-to-greet` input defined in action metadata file
// 	  const nameToGreet = core.getInput('who-to-greet');
// 	  console.log(`Hello ${nameToGreet}!`);
// 	  const time = (new Date()).toTimeString();
// 	  core.setOutput("time", time);
// 	  // Get the JSON webhook payload for the event that triggered the workflow
// 	  const payload = JSON.stringify(github.context.payload, undefined, 2)
// 	  // console.log(`The event payload: ${payload}`);
// 	  console.log('HEEEREEEEEEEE');
// 	  console.log(github.context.payload.issue.title) // issue event
// 	  console.log('HEEEREEEEEEEE');
// 	} 
// 	catch (error) {
// 	  core.setFailed(error.message);
// 	}
// }

// making change