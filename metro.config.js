const { getDefaultConfig } = require('expo/metro-config');
const os = require('os');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Explicit optimization for Apple M-Series (or high-core count architectures)
// Metro usually defaults to a conservative worker limit. We aggressively map it to the available CPUs to maximize parallel transform processing.
const cpus = os.cpus().length;
config.maxWorkers = Math.max(1, cpus - 1); // Leave 1 core for the OS

// Optimize caching and resolving
const FileStore = require('metro-cache').FileStore;
const path = require('path');
config.cacheStores = [
  new FileStore({
    root: path.join(os.tmpdir(), 'metro-cache-habit-tracker'),
  }),
];

module.exports = config;
