/** @param {NS} ns */
import { playerConfig, gameConfig } from 'config.js';

export async function main(ns) {
  if (playerConfig.log.silenced) {
    ns.disableLog('ALL');
  }

  while (true) {
    ns.run(gameConfig.scripts.netmap);
    ns.run(gameConfig.scripts.nuker);

    await ns.sleep(playerConfig.netmap.interval);
  }
}
