#!/usr/bin/env node

// External
const argi = require('argi');
const listr = require('listr');
const renderer = require('listr-render-builder');
const inquirer = require('inquirer');
const only = require('only');
const Conf = require('conf');

module.exports = opts =>
  new Promise((resolve, reject) => {
    const c = opts.config;

    if (!c.name) reject(new Error('No name set.'));

    const input = opts.input;
    const output = {};
    const config = new Conf({ configName: c.name, projectName: 'architected-config' });
    let foundHelp = false;

    for (const i in input) {
      output[i] = null;

      if (i === 'help') foundHelp = true;
      if (config.has(i) && input[i].save === true) input[i].default = config.get(i);
      if (!input[i].forceInput) argi.option(i, input[i].message, only(input[i], 'default hidden boolean alias'));
    }

    if (!foundHelp) argi.option('help', '', { hidden: true, boolean: false });

    const parsed = argi.parse(c.args || process.argv.slice(2), { name: c.name });

    if (parsed.help) {
      console.log(argi.help());
      process.exit(0);
    }

    for (const p in parsed) {
      if (input[p] !== undefined) {
        if (input[p].default !== parsed[p]) input[p]['set'] = true;
        if (input[p].save === true) config.set(p, parsed[p]);
      }

      output[p] = parsed[p];
    }

    const questions = [];
    const prompt = inquirer.createPromptModule();

    for (const i in input) {
      if (!input[i].forceCli && !input[i].set) {
        const q = only(input[i], 'type message default choices validate filter when pageSize');

        q.name = i;
        questions.push(q);
      }
    }

    prompt(questions)
      .then(answers => {
        for (const a in answers) {
          if (input[a].save === true) config.set(a, answers[a]);

          output[a] = answers[a];
        }

        console.log('');

        const tasks = new listr([], { renderer, collapse: false });

        const add = (name, opts, fn) => {
          if (typeof opts === 'function') {
            fn = opts;
            opts = {};
          }

          opts.title = name;
          opts.task = fn;

          tasks.add(opts);
        };

        const run = ctx => {
          if ((!(typeof ctx === 'object') && ctx !== null && ctx !== undefined) || Array.isArray(ctx)) throw new Error('Context must be an object');

          return tasks.run(Object.assign(output, ctx));
        };

        resolve({ ctx: output, run, add });
      })
      .catch(err => {
        reject(err);
      });
  });
