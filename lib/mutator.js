/**
 * Created by vedi on 22/02/2017.
 */

'use strict';

const _ = require('lodash');
const Bb = require('bluebird');
const glob = require('glob');

/**
 * Get files by glob patterns
 */
function getGlobbedFiles(globPatterns, removeRoot) {
  // URL paths regex
  const urlRegex = new RegExp('^(?:[a-z]+:)?//', 'i');

  // The output array
  let output = [];

  // If glob pattern is array so we use each pattern in a recursive way, otherwise we use glob
  if (Array.isArray(globPatterns)) {
    globPatterns.forEach((globPattern) => {
      output = _.union(output, getGlobbedFiles(globPattern, removeRoot));
    });
  } else if (_.isString(globPatterns)) {
    if (urlRegex.test(globPatterns)) {
      output.push(globPatterns);
    } else {
      glob.sync(globPatterns, {
        sync: true,
      }, (err, result) => {
        if (removeRoot) {
          result = result.map(file => file.replace(removeRoot, ''));
        }
        output = _.union(output, result);
      });
    }
  }

  return output;
}

function getFiles(path, baseFolder) {
  let fullPath;
  if (Array.isArray(path)) {
    fullPath = path.map(oneSourcePath => `${baseFolder}/${oneSourcePath}`);
  } else {
    fullPath = `${baseFolder}/${path}`;
  }
  return getGlobbedFiles(fullPath, './');
}

module.exports = {
  createConfig(app, mutation) {
    app.getGlobbedFiles = getGlobbedFiles;
    const { baseFolder = '', configs = [] } = mutation;
    return _.defaultsDeep(...getFiles(configs, baseFolder).map(file =>
      // eslint-disable-next-line import/no-dynamic-require, global-require
       require(file)));
  },
  mutate(app, mutation) {
    const { baseFolder = '', phases = [] } = mutation;
    return Bb
      .mapSeries(phases, (phase) => {
        const { baseFolder: phaseBaseFolder = baseFolder, sources = {}, makers = [] } = phase;

        // create sources
        sources.forEach(({ name, path: sourcePath, merge = false }) => {
          const files = getFiles(sourcePath, phaseBaseFolder);
          let sourceModules;
          if (!merge) {
            sourceModules = files.map(filePath =>
              // eslint-disable-next-line import/no-dynamic-require, global-require
              require(filePath));
          } else {
            sourceModules = _.merge(...files.map(file =>
              // eslint-disable-next-line import/no-dynamic-require, global-require
              require(file)));
          }
          Object.defineProperties(app, {
            [name]: {
              get() {
                return sourceModules;
              },
            },
          });
        });

        // init makers
        return Bb.mapSeries(makers, makerPath =>
          Bb.mapSeries(getFiles(makerPath, phaseBaseFolder), (filePath) => {
              // eslint-disable-next-line import/no-dynamic-require, global-require
            const maker = require(filePath);
            if (_.isFunction(maker.init)) {
              return maker.init(app);
            } else if (_.isFunction(maker)) {
              return maker(app);
            } else {
              return maker;
            }
          }));
      });
  },
};