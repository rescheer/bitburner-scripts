// netmap
export const NETWORK_MAP = 'network_map.txt';
export const NETMAP_INTERVAL = 30 * 1000;

// GAME INFO
export const ACCESS_EXES = [
  'BruteSSH.exe',
  'FTPCrack.exe',
  'relaySMTP.exe',
  'HTTPWorm.exe',
  'SQLInject.exe',
];
export const RAM_PRICE_PER_GB = 55000;
export const EMPTY_PORT_STRING = 'NULL PORT DATA';
export const HOME = 'home';

// PLAYER INFO
export const SCRIPTS = {
  hack: '/workers/hack.js',
  grow: '/workers/grow.js',
  weaken: '/workers/weaken.js',
  nuker: '/tasks/nuker.js',
  netmap: '/tasks/netmap.js',
  deployer: '/tasks/deployer-basic.js',
  hacknet: '/managers/hacknet-mgr.js',
  server: '/managers/server-mgr.js',
  network: '/managers/network-mgr.js',
  hacking: '/managers/hacking-mgr.js',
  overview: '/ui/overview.js',
};

// Ports
export const PORTS = {
  config: 1,
  configKeys: {},
  status: 2,
  statusKeys: {
    missingRam: 'missingRam',
  },
  hacknet: 3,
  pServer: 4,
  pServerKeys: {
    serverData: 'serverData',
    buyData: 'buyData',
  },
  deployer: 5,
  newDeployerTargets: 6,
};

// DEPLOYER SETTINGS
export const HACK_PERCENT = 0.5;
export const SLEEP_PADDING = 100;
export const TICK_INTERVAL = 500;
export const BASE_WIDTH = 50;
export const SEC_TOLERANCE = 0.1;
export const MONEY_TOLERANCE = 0.15;

// PROGRESS BARS
export const PBAR_LENGTH = BASE_WIDTH - 9;
export const PBAR_INACTIVE_CHAR = ' ';
export const PBAR_ACTIVE_CHAR = '+';

// DEBUG
export const DISABLE_LOGGING = 'ALL';
export const LOG_LEVEL = 'NONE';
