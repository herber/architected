const ava = require('ava');
const architected = require('./lib');

ava('parses cli args', t =>
  architected({ config: { args: ['--test', '--str', 'value'], name: 'arc-exm-001' }, input: { test: { boolean: true, message: 'none' }, str: { message: 'none' } } }).then(result => {
    t.is(result.ctx.test, true);
    t.is(result.ctx.str, 'value');
  })
);

ava('executes tasks', t =>
  architected({ config: { name: 'arc-exm-002', args: ['--test'] }, input: { test: { boolean: true, message: 'none' } } })
    .then(result => {
      t.plan(2);

      result.add('name1', () => {
        t.pass();
      });

      result.add('name2', { when: ctx => ctx.custom === 'yes' && ctx.test === true }, () => {
        t.pass();
      });

      return result;
    })
    .then(result => result.run({ custom: 'yes' }))
);
