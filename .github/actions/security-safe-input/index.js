const core = require('@actions/core');

async function run() {
   try {
        const prTitle = core.getInput('pr_title');
        if (prTitle.startsWith("feat")) {
            core.info("This is a feature PR.");
        } else {
            core.setFailed("PR is not a feat");
        }
   } catch (error) {
      core.setFailed(error.message);
   }
}   

run();