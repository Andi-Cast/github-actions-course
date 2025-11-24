const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');
const { title } = require('process');

const validateBranchName = ({ branchName }) => { 
   return /^[a-zA-Z0-9._/-]+$/.test(branchName)
}
const validateDirectoryName = ({ directoryName }) => { 
    return /^[a-zA-Z0-9._/-]+$/.test(directoryName)
}

const setupGit = async () => {
    await exec.exec('git config --global user.name "gh-automation"');
    await exec.exec('git config --global user.email "gh-automation@email.com"');
}

async function run() {
  const baseBranch = core.getInput('base-branch', { required: true });
  const targetbranch = core.getInput('target-branch', { required: true });
  const ghToken = core.getInput('gh-token', { required: true });
  const workingDir = core.getInput('working-directory', { required: true });
  const debug = core.getInput('debug');

  const commonExecOpts = {
    cwd: workingDir,
  }
  core.setSecret(ghToken);

  if(!validateBranchName({ branchName: baseBranch })) {
    core.setFailed(`Base branch name "${baseBranch}" is invalid.`);
    return;
  }

  if(!validateBranchName({ branchName: targetbranch })) {
    core.setFailed(`Target branch name "${targetbranch}" is invalid.`);
    return;
  }

  if(!validateDirectoryName({ directoryName: workingDir })) {
    core.setFailed(`Working directory name "${workingDir}" is invalid.`);
    return;
  }

  core.info(`[js-dependency-update] : base branch is${baseBranch}`);
  core.info(`[js-dependency-update] : target branch is${targetbranch}`);
  core.info(`[js-dependency-update] : working directory is${workingDir}`);

  await exec.exec( 'npm update', [], { ...commonExecOpts });

  const gitStatus = await exec.getExecOutput( 'git status -s package*.json', [], { ...commonExecOpts });

  if (gitStatus.stdout.length > 0) { 
    core.info('[js-dependency-update] : Changes detected, preparing to commit and push.');
    await setupGit();
    await exec.exec('git checkout -b ' + targetbranch, [], { ...commonExecOpts });
    await exec.exec('git add package.json package-lock.json', [], { ...commonExecOpts });
    await exec.exec('git commit -m "chore: update dependencies"' + targetbranch, [], { ...commonExecOpts });
    await exec.exec(`git push -u origin ${targetbranch} `, [], { ...commonExecOpts });

    const octokit = github.getOctokit(ghToken);

    try {
        await octokit.rest.pulls.create({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            title: 'Update NPM dependencies',
            body: 'This pull request updates NPM packages',
            base: baseBranch,
            head: targetbranch
        });
    } catch (error) {
        core.error(`[js-dependency-update] : Failed to create pull request`);
        core.error(error);
        core.setFailed(error.message);
        
    }
  } else {
    core.info('[js-dependency-update] : No changes detected, exiting.');
  }
}

run();