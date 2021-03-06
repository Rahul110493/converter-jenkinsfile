const yaml = require('js-yaml');

/**
 * https://github.com/circleci/build-agent/blob/2c97bd8862211a39e02d450cc1e797d7d2b82df5/data/config.schema.json#L349
 */
class CircleConfig {
  /**
   * @type {string}
   */
  name;

  /**
   * @type {{ [shorthand: string]: string }}
   */
  orbs;

  /**
   * @type {{
   *  [name: string]: {
   *      steps: (string | { [stepCommand: string]: string | { [stepParam: string]: any } })[],
   *      parameters?: {
   *          [paramName: string]: {
   *              description?: string,
   *              type: string,
   *              default?: string
   *          }
   *      }[]
   *      description?: string
   *  }
   * }}
   */
  commands;

  /**
   * @type { [paramName: string]: {
   *  description?: string,
   *  type: string,
   *  default: string
   * }}
   */
  parameters;

  /**
   * @type {{ [executorName: string]: {
   *  environment?: { [key: string]: string },
   *  working_directory?: string,
   *  shell?: string,
   *  resource_class?: string,
   *  docker?: CircleJobDockerContainer[],
   *  machine?: { image: string, docker_layer_caching?: boolean },
   *  macos?: { xcode: string }
   * }}}
   */
  executors;

  /**
   * @type {{ [key: string]: CircleJob }}
   */
  jobs;

  /**
   * @type {{ version: number, [key: string]: CircleWorkflowItem}
   */
  workflows;

  /**
   * Hidden property for handling comments
   * @type {string[]}
   */
  comments;

  /**
   * @param {number} version
   */
  constructor(name) {
    this.name = name;
    this.jobs = {};

    this.workflows = {
      name: "Build and Deploy"
    };

    this.comments = [];

    Object.defineProperty(this, 'comments', { enumerable: false });
  }

  toYAML() {
    let ret = yaml.safeDump(this, { skipInvalid: true, lineWidth: 512, noRefs: true });

    if (this.comments.length > 0) {
      ret += `\n# ${this.comments
        .join('\n')
        .trim()
        .replace(/\n/g, '\n# ')}\n`;
    }

    return ret;
  }
}

module.exports = { CircleConfig };
