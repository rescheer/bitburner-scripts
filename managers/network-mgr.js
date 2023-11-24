/** @param {NS} ns */
import { NETMAP_INTERVAL, SCRIPTS, DISABLE_LOGGING } from 'config.js';

export async function main(ns) {
  ns.disableLog(DISABLE_LOGGING);

  while (true) {
    ns.run(SCRIPTS.netmap);
    ns.run(SCRIPTS.nuker);
    await ns.sleep(NETMAP_INTERVAL);
  }
}
