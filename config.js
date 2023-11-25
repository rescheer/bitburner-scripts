export const gameConfig = {
  accessExes: [
    'BruteSSH.exe',
    'FTPCrack.exe',
    'relaySMTP.exe',
    'HTTPWorm.exe',
    'SQLInject.exe',
  ],
  scripts: {
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
  },
  baseRamPrice: 55000,
  home: 'home',
};

export const playerConfig = {
  log: {
    silenced: true,
  },
  pServer: {
    enabled: true,
    moneyUsed: 0.5,
  },
  hacknet: {
    enabled: false,
    moneyUsed: 0.5,
  },
  deployers: {
    enabled: true,
    hackPercent: 0.5,
    sleepPadding: 100,
    interval: 500,
    securityTolerance: 0.1,
    moneyTolerance: 0.15,
  },
  netmap: {
    file: 'network_map.txt',
    interval: 30 * 1000,
  },
};

export const portConfig = {
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

// PROGRESS BARS
export const BASE_WIDTH = 50;
export const PBAR_LENGTH = BASE_WIDTH - 9;
export const PBAR_INACTIVE_CHAR = ' ';
export const PBAR_ACTIVE_CHAR = '█';