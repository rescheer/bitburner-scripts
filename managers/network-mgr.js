import { portConfig, gameConfig } from 'config.js';
import { peekPortObject } from 'lib/Ports.js';

/** @param {NS} ns */
export async function main(ns) {
  const configPort = ns.getPortHandle(portConfig.config);

  while (true) {
    const playerSettings = peekPortObject(configPort);
    if (playerSettings.log.silenced) {
      if (ns.isLogEnabled('sleep')) {
        ns.disableLog('ALL');
      }
    } else {
      if (!ns.isLogEnabled('sleep')) {
        ns.enableLog('ALL');
      }
    }

    ns.run(gameConfig.scripts.netmap);
    ns.run(gameConfig.scripts.nuker);

    await ns.sleep(playerSettings.netmap.interval);
  }
}
