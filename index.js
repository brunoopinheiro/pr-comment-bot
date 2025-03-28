const core = require("@actions/core");
const github = require("@actions/github");
const fs = require("fs");
const xml2js = require("xml2js");

async function run() {
  try {
    const token = core.getInput("token");
    const prNumber = core.getInput("pr_number");
    const resultsPath = core.getInput("pytest_results");

    const xmlData = fs.readFileSync(resultsPath, "utf-8");
    const parser = new xml2js.Parser();
    const results = await parser.parseStringPromise(xmlData);

    const testCases = results.testsuites.testsuite[0].testcase;
    let markdownTable = `| Test | Status |\n|------|--------|\n`;
    results.forEach(test => {
      const testName = test.$.name;
      const status = test.failure ? "❌" : "✅";
      markdownTable += `| ${test.name} | ${test.status} | \n`;
    });
    
    const octokit = github.getOctokit(token);
    const { context } = github;
    await octokit.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: prNumber,
      body: `### Pytest Results 🧪\n${markdownTable}`
    });

    console.log("Comment created successfully");

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();