/*

    This mapper file will contain these core features:
        Mapping JenksinsJSON object to CircleCI Model by recursively iterating over JSON object and it's children.
        Contain reference to a LUT which will source and destinations for each declaration
        Track which children were not properly translated
    
*/

const { CircleConfig } = require('../model/CircleConfig.js');
const { CircleJob } = require('../model/CircleJob.js');
const { CircleWorkflowItem } = require('../model/CircleWorkflowItem.js');
const { CircleWorkflowJobCondition } = require('../model/CircleWorkflowJobCondition.js');
const { fnPerVerb } = require('./mapper_steps.js');
const { assignedFields } = require('./mapper_utils.js');
const { mapConditions } = require('./mapper_conditions.js');
const { prepMapEnvironment } = require('./mapper_directives.js');

const map = (arr) => {
  const config = new CircleConfig("Test and Deploy");
  const pipeline = arr['pipeline'];

  if (!pipeline) {
    console.log(
      'Pipeline object not found. Only declarative Jenkinsfiles are supported at this time.'
    );
    return undefined;
  }

  const mapEnvironment = prepMapEnvironment();
  mapEnvironment(pipeline, 'pipeline');

  const stages = pipeline['stages'];

  if (!stages) {
    console.log('No stages detected in Jenkinsfile.');
    return undefined;
  }

  mapStages(stages, mapEnvironment, config);

  return config;
};

const mapStages = (stages, mapEnvironment, config) => {
 // const workflow = new CircleWorkflowItem();
  // Hard-coded workflow name--no multiple workflow support yet
  //config['workflows']['build-and-test'] = workflow;

  stages.forEach((stage) => {
    const workflowJobConditionObj = new CircleWorkflowJobCondition();
    // let envVars = stage['environment'];



   if (stages.length > 0) {
	         let precedingJobName;
	         if (stages.length === 1) {
			         precedingJobName = [stages[stages.length - 1]];
			       } else {
				               precedingJobName = Object.keys(stages[stages.length - 1]);
				             }
	   
	         workflowJobConditionObj['needs'] = precedingJobName;
	       }
	  if (!stage.parallel) {
      mapJob(stage, mapEnvironment, workflowJobConditionObj, config['jobs']);
    } else {
      stage.parallel.forEach((parallelStage) => {
        mapJob(parallelStage, mapEnvironment, workflowJobConditionObj, config['jobs']);
      });
    }
  });
};

const dockerImagesForJob = (stage) => {
  if (stage.agent && stage.agent.type === 'docker' && stage.agent.arguments) {
    // Agent is Docker. Find the argument with `key` having `image`
    const ret = [];

    stage.agent.arguments.forEach((argument) => {
      if (argument.key === 'image') {
        ret.push({ image: String(argument.value.value) });
      }
    });

    return ret;
  } else {
    // Fallback
    // goes 2 days back to make sure monthly snapshot has had time to be created (2nd of month)
    let curDate = new Date(Date.now() - 172800000);
    let curMonth = (curDate.getMonth() < 9 ? '0' : '') + (curDate.getMonth() + 1);

    return [{ image: `cimg/base:${curDate.getFullYear()}.${curMonth}` }];
  }
};

const mapJob = (stage, mapEnvironment,  conditions, config) => {
  let job = new CircleJob();

  job.docker = dockerImagesForJob(stage);
  job.environment = mapEnvironment(stage, 'stage');

  mapConditions(stage, conditions);

  let stageJobName = stage.name.replace(/ /g, '-').toLowerCase();
  if (assignedFields(conditions)) {
    stage.steps.push({ [stageJobName]: conditions });
  } else {
    stage.steps.push(stageJobName);
  }

  if (stage.stages) {
    // TODO: Implement support for nested stages
    job.steps = [
         {
        run: JSON.stringify(stage),
        name: 'Nested stage not unsupported',     
      } 
    ];
  } else {
    job.steps = fnPerVerb(stage.branches[0].steps);
  }

  config[stageJobName] = job;
};

module.exports = { map };
