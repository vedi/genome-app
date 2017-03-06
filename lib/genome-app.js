/**
 * Created by vedi on 22/02/2017.
 */

'use strict';

const _ = require('lodash');
const mutator = require('./mutator');
// eslint-disable-next-line import/no-dynamic-require
const mutation = require(process.env.MUTATION || '../../../config/mutation');

// init app
const providers = {};
const app = new Proxy({
  registerProvider(name, handler) {
    providers[name] = handler;
  },
}, {
  get(target, name) {
    if (!(name in target)) {
      const provider = providers[name];
      if (!provider) {
        throw new Error(`No provider for ${name} provided`);
      }
      return _.isFunction(provider) ? provider(name) : provider;
    }
    return target[name];
  },
});

app.registerProvider('config', mutator.createConfig(app, mutation));
app.init = () => mutator.mutate(app, mutation);

module.exports = app;
