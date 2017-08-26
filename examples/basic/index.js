#!/usr/bin/env node

const { writeFileSync, mkdirSync } = require('fs');
const { join } = require('path');

const architected = require('../../lib/')({
  config: {
    name: 'basic-example'
  },
  input: {
    path: {
      message: 'Where your project should be',
      default: process.cwd(),
      forceCli: true
    },
    name: {
      message: 'Whats the name',
      type: 'input',
      forceInput: true
    },
    description: {
      message: 'Whats your project about',
      type: 'input'
    }
  }
});

architected
  .then(result => {
    const { run, add } = result;

    add('generate package.json', ctx => {
      ctx.pkg = `{
  "name": "${ctx.name}",
  "description": "${ctx.description}",
  "version": "0.0.0",
  "license": "MIT"
}`;
    });

    add('create project directory', ctx => {
      ctx.created = true;

      try {
        mkdirSync(join(ctx.path, ctx.name));
      } catch (err) {
        ctx.created = false;
        throw new Error(`Could not create project dir\n${err}`);
      }
    });

    add('write package.json', { enabled: ctx => ctx.created }, ctx => {
      try {
        writeFileSync(join(ctx.path, ctx.name, 'package.json'), ctx.pkg);
      } catch (err) {
        throw new Error(`Could not create package.json\n${err}`);
      }
    });

    run().catch(err => {
      console.error(err);
    });
  })
  .catch(err => {
    console.error(err);
  });
