const core = require("@actions/core");
const github = require("@actions/github");
const fs = require("fs");
const xml2js = require("xml2js");

async function run() {
  try {
    const token = core.getInput("token");
    const prNumber = core.getInput("pr_number");
    const resultsPath = core.getInput("results");

    const xmlData = fs.readFileSync(resultsPath, "utf-8");
    const parser = new xml2js.Parser();
    const results = await parser.parseStringPromise(xmlData);

    const testCases = results.testsuites.testsuite[0].testcase;
    let markdownTable = `| Test | Status |\n|------|--------|\n`;
    let failedTests = [];
    
    testCases.forEach(test => {
      const testName = test.$.name;
      if (test.failure) {
        markdownTable += `| ${testName} | ❌ | \n`;
        failedTests.push({ name: testName, message: test.failure[0]._ });
      } else {
        markdownTable += `| ${testName} | ✅ | \n`;
      }
    });

    let failureDetails = "";
    if (failedTests.length > 0) {
      failureDetails = "\n<details>\n <summary>❌ Failed Tests (Click to Expand)</summary>\n\n";
      failedTests.forEach(test => {
        failureDetails += `**${test.name}**\n\`\`\`\n${test.message.trim()}\n\`\`\`\n\n`;
      });
      failureDetails += "</details>\n";
    }

    const commentBody = `### Pytest Results 🧪\n\n${markdownTable}${failureDetails}`;
    
    const octokit = github.getOctokit(token);
    const { context } = github;
    await octokit.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: prNumber,
      body: commentBody
    });

    console.log("Comment created successfully");

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();