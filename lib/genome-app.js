/**
 * Created by vedi on 22/02/2017.
 */

'use strict';

const _ = require('lodash');
const mutator = require('./mutator');

const useFallback = !process.env.MUTATION;
const mutationPath = process.env.MUTATION || 'config/mutation';
let mutation = null;
try {
  // eslint-disable-next-line import/no-dynamic-require,global-require
  mutation = require(`../../../${mutationPath}`);
} catch (err) {
  if (useFallback) {
    try {
    // eslint-disable-next-line import/no-dynamic-require,global-require
      mutation = require(mutationPath);
    } catch (err) {
      //
    }
  }
}
if (!mutation) {
  throw new Error(`Cannot resolve mutation config: ${mutationPath}`);
}

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

const config = mutator.createConfig(app, mutation);

app.registerProvider('config', () => config);
app.init = (options = {}) => {
  Object.assign(config, options);
  return mutator.mutate(app, mutation);
};

module.exports = app;
