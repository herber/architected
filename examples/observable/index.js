#!/usr/bin/env node

const { writeFileSync, mkdirSync } = require('fs');
const { join } = require('path');

const Observable = require('zen-observable');
const delay = require('delay'); // For a cool effect

const architected = require('../../lib/')({
  config: {
    name: 'observable-example'
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
    },
    cli: {
      message: 'Do you need a cli',
      type: 'confirm',
      default: false,
      boolean: true
    }
  }
});

architected
  .then(result => {
    const { run, add } = result;

    add(
      'generate files',
      ctx =>
        new Observable(observer => {
          delay(100)
            .then(() => {
              observer.next('Generating package.json');

              ctx.pkg = `{
  "name": "${ctx.name}",
  "description": "${ctx.description}",
  "version": "0.0.0",
  "license": "MIT"${ctx.cli ? ',\n  "bin": "./cli.js"' : ''}
}`;

              return delay(300);
            })
            .then(() => {
              observer.next('Generating index.js');

              ctx.i = `module.exports = () => {
  return {
    name: '${ctx.name}'
  }
};`;

              return delay(300);
            })
            .then(() => {
              if (ctx.cli) {
                observer.next('Generating cli.js');

                ctx.clijs = `const ${ctx.name} = require('./');

${ctx.name}();`;
              }

              observer.complete();
            });
        })
    );

    add('create project directory', ctx => {
      ctx.created = true;

      try {
        mkdirSync(join(ctx.path, ctx.name));
      } catch (err) {
        ctx.created = false;
        throw new Error(`Could not create project dir\n${err}`);
      }
    });

    add(
      'write files',
      { enabled: ctx => ctx.created },
      ctx =>
        new Observable(observer => {
          delay(0)
            .then(() => {
              observer.next('Write package.json');
              writeFileSync(join(ctx.path, ctx.name, 'package.json'), ctx.pkg);

              return delay(300);
            })
            .then(() => {
              observer.next('Write index.js');
              writeFileSync(join(ctx.path, ctx.name, 'index.js'), ctx.i);

              return delay(300);
            })
            .then(() => {
              if (ctx.cli) {
                observer.next('Write cli.js');
                writeFileSync(join(ctx.path, ctx.name, 'cli.js'), ctx.clijs);
              }

              observer.complete();
            });
        })
    );

    run().catch(err => {
      console.error(err);
    });
  })
  .catch(err => {
    console.error(err);
  });
