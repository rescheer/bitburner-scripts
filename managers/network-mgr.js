/** @param {NS} ns */
import { playerConfig } from 'config.js';

export async function main(ns) {
  if (playerConfig.log.silenced) {
    ns.disableLog('ALL');
  }

  while (true) {
    ns.run(playerConfig.scripts.netmap);
    ns.run(playerConfig.scripts.nuker);

    await ns.sleep(playerConfig.netmap.interval);
  }
}
