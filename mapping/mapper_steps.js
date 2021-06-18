const { isLiteral } = require('./mapper_utils.js');

const fnPerVerb = (stepsArr) => {
  let steps = [];
  stepsArr.map((step) => {
    let output = directiveToCommand(step);
    if (!Array.isArray(output)) {
      steps.push(output);
    } else {
      output.map((stepObject) => steps.push(stepObject));
    }
  });
  return steps;
};

const directives = {
  script: (step) => {
    // {"sh":  "Run arbitrary Java"}
    let stepObject = {};

    stepObject[`run`][`name`] = 'Consider re-writing as a CircleCI run step';
    stepObject[`run`] =
      step.name +
      ' ' +
      step[`arguments`][0][`value`][`value`];

    return stepObject;
  },
  sh: (step) => {
    // {"sh":  "Shell command"}
    let stepObject = {};

    if (!isLiteral(step)) {
      stepObject[`name`] = 'Confirm environment variables are set before running';
      stepObject[`run`] =
        step.name +
        ' ' +
        step[`arguments`][0][`value`][`value`];
    } else {
      stepObject[`run`] = step[`arguments`][0][`value`][`value`];
    }

    return stepObject;
  },
  echo: (step) => {
    // {"echo":  "Print Message"}
    let stepObject = {};

    stepObject[`run`]= 'echo "' + step[`arguments`][0][`value`][`value`] + '"';

    return stepObject;
  },
  sleep: (step) => {
    // {"sleep":  "Sleep"}
    let stepObject = {};
    stepObject[`run`]= 'sleep ' + step[`arguments`][0][`value`][`value`];

    return stepObject;
  },
  catchError: (step) => {
    // {"catchError": "Catch error and set build result to failure"}
    // Consider `when` step
    let stepObject = {};

    stepObject[`name`] = 'Use conditional steps';
    stepObject[`run`]=
      step.name +
      ' ' +
      step[`arguments`][0][`value`][`value`];

    return stepObject;
  },
  dir: (step) => {
    // {"dir":  "Change current directory"}
    let stepsArr = fnPerVerb(step.children);
    stepsArr.forEach((stepObject) => {
      stepObject[`working_directory`] = step.arguments.value;
    });
    return stepsArr;
  },
  mail: (step) => {
    // {"mail":  "Mail"}
    let stepObject = {};

    stepObject[`name`] = 'Use built-in e-mail notifications';
    stepObject[`run`] =
      step.name +
      ' ' +
      step[`arguments`][0][`value`][`value`];

    return stepObject;
  },
  error: (step) => {
    // {"error":  "Error signal"}
    // Consider `when` step
    let stepObject = {};

    stepObject[`name`] = 'Use conditional steps';
    stepObject[`run`] =
      step.name +
      ' ' +
      step[`arguments`][0][`value`][`value`] ;

    return stepObject;
  },
  warnError: (step) => {
    // {"warnError":  "Catch error and set build and stage result to unstable"}
    // Consider `when` step
    let stepObject = {};

    stepObject[`name`] = 'Use conditional steps';
    stepObject[`run`] =
      step.name +
      ' ' +
      step[`arguments`][0][`value`][`value`] ;

    return stepObject;
  },
  pwd: () => {
    // {"pwd":  "Determine current directory"}
    let stepObject = {};

    stepObject[`name`] = 'Print working directory';
    stepObject[`run`] = 'pwd';

    return stepObject;
  },
  fileExists: (step) => {
    // {"fileExists":  "Verify if file exists in workspace"}
    // Consider `when` step
    let stepObject = {};

    stepObject[`name`] = 'Check if file exists';
    stepObject[`run`] =
      'if test -f "' +
      step[`arguments`][0][`value`][`value`] +
      '"; then \
        echo "file exists" \
        exit 0" \
      fi \
      exit 1';

    return stepObject;
  },
  withEnv: (step) => {
    // {"withEnv":  "Set environment variables"}
    let jenkinsEnvVarArr = step.arguments.value.split(',');
    let jsonEnvVarArr = [];

    jenkinsEnvVarArr.forEach((envVar) => {
      jsonEnvVarArr.push(envVar.substring(1, envVar.length - 1));
    });
    jsonEnvVarArr[0] = jsonEnvVarArr[0].substring(3);
    jsonEnvVarArr[jsonEnvVarArr.length - 1] = jsonEnvVarArr[jsonEnvVarArr.length - 1].substring(
      0,
      jsonEnvVarArr[jsonEnvVarArr.length - 1].length - 2
    );

    let envVarObj = jsonEnvVarArr.reduce((obj, kv) => {
      let kvParts = kv.split('=');
      if (kvParts[0] && kvParts[1]) {
        obj[kvParts[0]] = kvParts[1];
      }
      return obj;
    }, {});

    let fullEnvObj = {};
    for (var key in envVarObj) {
      fullEnvObj[key] = envVarObj[key];
    }

    let stepsArr = fnPerVerb(step.children);
    stepsArr.forEach((stepObject) => {
      stepObject[`name`] = 'Run command with defined env vars';
      stepObject[`environment`] = fullEnvObj;
    });

    return stepsArr;
  },
  readFile: (step) => {
    // {"readFile":  "Read file from workspace"}
    let stepObject = {};

    stepObject[`name`] = 'Running readFile with cat';
    stepObject[`run`] = 'cat ' + step[`arguments`][0][`value`][`value`];

    return stepObject;
  },
  unstable: (step) => {
    // {"unstable":  "Set stage result to unstable"}
    let stepObject = {};

    stepObject[`name`] = 'Refer to documentation';
    stepObject[`run`] = step.name + ' ' + step[`arguments`][0][`value`][`value`];

    return stepObject;
  },
  writeFile: (step) => {
    // {"writeFile":  "Write file to workspace"}
    let stepObject = {};

    stepObject[`name`] = 'Use CircleCI caches or workspaces';
    stepObject[`run`] = step.name + ' ' + step[`arguments`][0][`value`][`value`];

    return stepObject;
  },
  unstash: (step) => {
    // {"unstash":  "Restore files previously stashed"}
    let stepObject = {};

    stepObject[`name`] = 'Use CircleCI caches or workspaces';
    stepObject[`run`] = step.name + ' ' + step[`arguments`][0][`value`][`value`];

    return stepObject;
  },
  archive: (step) => {
    // {"archive":  "Archive artifacts"}
    let stepObject = {};

    stepObject[`name`] = 'Use CircleCI caches or workspaces';
    stepObject[`run`] = step.name + ' ' + step[`arguments`][0][`value`][`value`];

    return stepObject;
  },
  unarchive: (step) => {
    // {"unarchive":  "Copy archived artifacts into the workspace"}
    let stepObject = {};

    stepObject[`name`] = 'Use CircleCI caches or workspaces';
    stepObject[`run`] = step.name + ' ' + step[`arguments`][0][`value`][`value`];

    return stepObject;
  },
  getContext: (step) => {
    // {"getContext":  "Get contextual object from internal APIs"}
    let stepObject = {};

    stepObject[`name`] = 'Use CircleCI contexts';
    stepObject[`run`] =  step.name + ' ' + step[`arguments`][0][`value`][`value`];

    return stepObject;
  },
  withContext: (step) => {
    // {"withContext":  "Use contextual object from internal APIs"}
    let stepObject = {};

    stepObject[`name`] = 'Use CircleCI contexts';
    stepObject[`run`] = step.name + ' ' + step[`arguments`][0][`value`][`value`] ;

    return stepObject;
  },
  step: (step) => {
    // {"step":  "General Build Step"}
    let stepObject = {};

    stepObject[`name`] = 'Nested steps within stages';
    stepObject[`run`] = step.name + ' ' + step[`arguments`][0][`value`][`value`];

    return stepObject;
  },
  isUnix: () => {
    // {"isUnix":  "Checks if running on a Unix-like node"}
    let stepObject = {};

    stepObject[`run`] = '[ $(uname -s) = "Linux" ]; exit $?';

    return stepObject;
  },
  deleteDir: (step) => {
    // {"deleteDir":  "Recursively delete the current directory from the workspace"}
    let stepObject = {};

    stepObject[`name`] = 'Revisit need to use deleteDir';
    stepObject[`run`] =  step.name + ' ' + step[`arguments`][0][`value`][`value`] ;

    return stepObject;
  },
  retry: (step) => {
    // {"retry":  "Retry the body up to N times"}
    // Consider `when` step
    let stepObject = {};

    stepObject[`name`] = 'Use conditional steps';
    stepObject[`run`] = step.name + ' ' + step[`arguments`][0][`value`][`value`] ;

    return stepObject;
  },
  timeout: (step) => {
    // {"timeout":  "Enforce time limit"}
    let stepObject = {};

    stepObject[`name`] = 'Use conditional steps';
    stepObject[`run`][`JFC_STACK_TRACE`] = step.name + ' ' +  step[`arguments`][0][`value`][`value`] ;

    return stepObject;
  },
  tool: (step) => {
    // {"tool":  "Use a tool from a predefined Tool Installation"}
    let stepObject = {};

    stepObject[`name`] = 'No plug-ins in CircleCI';
    stepObject[`run`] =  step.name + ' ' + step[`arguments`][0][`value`][`value`];

    return stepObject;
  },
  waitUntil: (step) => {
    // {"waitUntil":  "Wait for condition"}
    // Consider `when` step

    stepObject[`name`] = 'Use conditional steps';
    stepObject[`run`] =  step.name + ' ' +  step[`arguments`][0][`value`][`value`] ;
    return stepObject;
  },
  default: (step) => {
    let stepObject = {};

    stepObject[`name`] = 'Keyword not recognized\n';
    stepObject[`run`] = step.name +  ' ' +  step.arguments[0].value.value;

    return stepObject;
  }
};

const directiveToCommand = (step) => {
  return (directives[step.name] || directives['default'])(step);
};

module.exports = { directiveToCommand, fnPerVerb };
