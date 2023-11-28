import { portConfig, gameConfig } from 'cfg/config';
import PortWrapper from 'lib/PortWrapper';

/** @param {NS} ns */
export async function main(ns) {
  const configPort = new PortWrapper(ns, portConfig.config);

  while (true) {
    const playerSettings = configPort.peek();
    if (playerSettings.log.silenced) {
      if (ns.isLogEnabled('sleep')) {
        ns.disableLog('ALL');
      }
    } else if (!ns.isLogEnabled('sleep')) {
      ns.enableLog('ALL');
    }

    ns.run(gameConfig.scripts.netmap);
    ns.run(gameConfig.scripts.nuker);

    await ns.sleep(playerSettings.netmap.interval);
  }
}
