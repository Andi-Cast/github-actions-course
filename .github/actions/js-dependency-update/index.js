const core = require('@actions/core');
const exec = require('@actions/exec');

const validateBranchName = ({ branchName }) => { 
   return /^[a-zA-Z0-9._/-]+$/.test(branchName)
}
const validateDirectoryName = ({ directoryName }) => { 
    return /^[a-zA-Z0-9._/-]+$/.test(directoryName)
}

async function run() {
  const baseBranch = core.getInput('base-branch');
  const targetbranch = core.getInput('target-branch');
  const ghToken = core.getInput('gh-token');
  const workingDir = core.getInput('working-directory');
  const debug = core.getInput('debug');

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

  await exec.exec( 'npm update', [], { cwd: workingDir });

  const gitStatus = await exec.getExecOutput( 'git status -s package*.json', [], { cwd: workingDir });

  if (gitStatus.stdout.length > 0) { 
    core.info('[js-dependency-update] : Changes detected, preparing to commit and push.');
  } else {
    core.info('[js-dependency-update] : No changes detected, exiting.');
  }
}

run();