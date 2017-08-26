# Architected [![Codestyle fyi](https://img.shields.io/badge/code%20style-fyi-E91E63.svg)](https://github.com/tobihrbr/fyi) [![Build Status](https://travis-ci.org/tobihrbr/architected.svg?branch=master)](https://travis-ci.org/tobihrbr/architected)

> A tool for cli utilities.

## About

Architected is a small wrapper around [inquirer](https://github.com/SBoudrias/Inquirer.js/), [listr](https://github.com/samverschueren/listr) and [argi](https://github.com/tobihrbr/argi). It seamlessly manages arguments, user input and logging. You can spilt workloads into synchronous and asynchronous tasks.

## Install

```bash
$ npm install --save architected
```

## Usage

```js
const config = {
  // Configuration for architected
  config: {
    name: 'my cli app'
  },
  // The user input you want to receive.
  input: {
    name: {
      message: 'A short description',
      default: 'My default',
      type: 'input'
    }
  }
}

const architected = require('architected')(config);

architected.then((result) => {
  const { run, add } = result;

  // Add a task
  add('my first task', (ctx, task) => {
    // Do the things
  });

  add('my second task', (ctx, task) => {
    // Do other tings
  });

  // Run tasks
  run().catch((err) => {
    console.error(err);
  });
}).catch((err) => {
  console.error(err);
})
```

## API

### architected(config)

#### config

Configuration for architected.

##### name

Type: `string`

Required

The name of your project(will be used for `--help`).

##### args

Type: `array`

Default: `process.argv.slice(2)`

Custom arguments. You should only change this if you have to.

#### input

User input you want to receive.

##### name

Type: `object`

What the user input should be called. You need this to get the value of the user input.

- message  <br /> Type: `sting` <br /> A short description. It will be displayed in `--help` and in the input prompt.

- default <br /> Type: every <br /> Will be used if the user does not specify a value.

- save <br /> Type: every <br /> If set to `true` the user input will be saved and will be suggested next time the user executes your cli utility.

- boolean <br /> Type: `boolean` <br /> Force input to be either `true` or `false`. <br /> Only for arguments.

- alias <br /> Type: `string`, `array` <br /> Alternative name(eg. a short version). <br /> Only for arguments.

- hidden <br /> Type: `boolean` <br /> Whether the user input should be displayed in `--help`. <br /> Only for arguments.

- type <br /> Type: `string` <br /> Type of the user input, can be `input`, `confirm`, `list`, `rawlist`, `expand`, `checkbox`, `password`, `editor`. <br /> Only for prompt. <br /> [Learn more](https://github.com/SBoudrias/Inquirer.js/blob/master/README.md#question)

- choices <br /> Type: `array`, `function` <br /> Choices for the user can only be used for certain `type`s. <br /> Only for prompt. <br /> [Learn more](https://github.com/SBoudrias/Inquirer.js/blob/master/README.md#question)

- validate <br /> Type: `function` <br /> Receives user input as the first argument. Should return `true` if input is valid or `false` if input is invalid. <br /> Only for prompt.

- filter <br /> Type: `function` <br /> Receives user input as the first argument. Should return the filtered value. <br /> Only for prompt.

- when <br /> Type: `function` <br /> Receives the previous user input as the first argument. Should return `true` if the prompt can be displayed. <br /> Only for prompt.

- pageSize <br /> Type: `number` <br /> The number of lines that will be rendered. Can only be used for `list`, `rawList`, `expand` or `checkbox`. <br /> Only for prompt.

### Returns

Type: `promise`

Will be called when all the user input is received and parsed.

#### ctx

Type: `object`

An object containing the user input.

Example:

```js
...
console.log(ctx.name);
// Logs name input to the console.
...
```

#### add(name, [options], task)

Add a new task

Example:
```js
...
  add('my-task', (ctx, task) => {
    // ctx = up to date user input
    // `task` can be used to control the task
    if (ctx.input === 'skip') {
      task.skip('reason');
    }

    ctx.enableOther = true;
  });

  add('my-task-2', { enabled: ()  }, (ctx, task) => {
    if (ctx.input === 'skip') {
      task.skip('reason');
    }
  });
...
```

##### name

Type: `string`

The name of your task will be used for logging.

##### options

Type: `object`

Options for `listr`. [Learn more](https://github.com/SamVerschueren/listr/blob/master/readme.md#usage)

##### task

Type: `function`

Where you should do your stuff.

[Learn more](https://github.com/SamVerschueren/listr/blob/master/readme.md#usage)

#### run([ctx])

Execute all tasks.

##### ctx

Type: `object`

Custom context. Will be `Object.assign`ed to the user input.

## Examples

### Basic

> A simple `package.json` generator.

```js
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

architected.then((result) => {
  const { run, add } = result;

  add('generate package.json', (ctx, task) => {
    ctx.pkg = `{
  "name": "${ ctx.name }",
  "description": "${ ctx.description }",
  "version": "0.0.0",
  "license": "MIT"
}`
  });

  add('create project directory', (ctx, task) => {
    ctx.created = true;

    try {
      mkdirSync(join(ctx.path, ctx.name));
    } catch (err) {
      ctx.created = false;
      throw new Error(`Could not create project dir\n${ err }`);
    }
  });

  add('write package.json', { enabled: (ctx) => ctx.created }, (ctx, task) => {
    try {
      writeFileSync(join(ctx.path, ctx.name, 'package.json'), ctx.pkg);
    } catch (err) {
      throw new Error(`Could not create package.json\n${ err }`);
    }
  });

  run().catch((err) => {
    console.error(err);
  })
}).catch((err) => {
  console.error(err);
});
```

### Observable

> A simple node.js project boilerplate.

```js
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

architected.then((result) => {
  const { run, add } = result;

  add('generate files', (ctx, task) => (
    new Observable(observer => {
      delay(100)
        .then(() => {
          observer.next('Generating package.json');

          ctx.pkg = `{
  "name": "${ ctx.name }",
  "description": "${ ctx.description }",
  "version": "0.0.0",
  "license": "MIT"${ ctx.cli ? ',\n  "bin": "./cli.js"' : '' }
}`;

          return delay(300);
        }).then(() => {
          observer.next('Generating index.js');

          ctx.i = `module.exports = () => {
  return {
    name: '${ ctx.name }'
  }
};`;

          return delay(300);
        }).then(() => {
          if (ctx.cli) {
            observer.next('Generating cli.js');

            ctx.clijs = `const ${ ctx.name } = require('./');

${ ctx.name }();`;
          }

          observer.complete();
        });
    })
  ));

  add('create project directory', (ctx, task) => {
    ctx.created = true;

    mkdirSync(join(ctx.path, ctx.name));
    try {
    } catch (err) {
      ctx.created = false;
      throw new Error(`Could not create project dir\n${ err }`);
    }
  });

  add('write files', { enabled: (ctx) => ctx.created }, (ctx, task) => (
    new Observable(observer => {
      delay(0)
        .then(() => {
          observer.next('Write package.json');
          writeFileSync(join(ctx.path, ctx.name, 'package.json'), ctx.pkg);

          return delay(300);
        }).then(() => {
          observer.next('Write index.js');
          writeFileSync(join(ctx.path, ctx.name, 'index.js'), ctx.i);

          return delay(300);
        }).then(() => {
          if (ctx.cli) {
            observer.next('Write cli.js');
            writeFileSync(join(ctx.path, ctx.name, 'cli.js'), ctx.clijs);
          }

          observer.complete();
        });
    })
  ));

  run().catch((err) => {
    console.error(err);
  })
}).catch((err) => {
  console.error(err);
});
```

## License

MIT © [Tobias Herber](https://tobihrbr.com)
