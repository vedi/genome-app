/**
 * Created by vedi on 22/02/2017.
 */

'use strict';

module.exports = {
  // eslint-disable-next-line import/no-dynamic-require, global-require
  resolver: (file) => require(file),
  baseFolder: './app',
  configs: [
    '../config.local.json', '../config.local.js',
    `../config/env/${process.env.NODE_ENV}.js`, '../config/env/all.js',
    '**/config/*/.js',
  ],
  phases: [
    {
      sources: [
        { name: 'consts', path: ['lib/consts.js', '**/consts/*.js'], merge: true },
        { name: 'models', path: '**/models/*.server.model.js' },
      ],
      makers: [
        '../makers/mongoose.js',
      ],
    },
    {
      sources: [
        { name: 'eventHandlers', path: '**/event-handlers/*.event-handler.js' },
      ],
      makers: [
        '../makers/event-bus.js',
      ],
    },
    {
      sources: [
        { name: 'controllers', path: '**/controllers/api/*.restifizer.controller.js' },
      ],
      makers: [
        '../makers/express.js',
        '**/services/*.service.js',
      ],
    },
    {
      sources: [
        { name: 'jobs', path: '**/jobs/*.jobs.js' },
      ],
      makers: [
        '../makers/agenda.js',
      ],
    },
    {
      sources: [
        {
          name: 'tests',
          path: process.env.NODE_ENV === 'test'
            ? ['../test/spec/**/*.spec.js', '**/test/spec/**/*.spec.js']
            : [],
          resolve: false,
        },
      ],
    },
  ],
};
