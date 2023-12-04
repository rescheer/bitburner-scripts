import { gameConfig, portConfig } from 'cfg/config';
import PortWrapper from 'lib/PortWrapper';

/** @param {NS} ns */
export async function main(ns) {
  const configPort = new PortWrapper(ns, portConfig.config);
  const newTargetsPort = new PortWrapper(ns, portConfig.newDeployerTargets);
  const lowRamMode = ns.args[0] || false;

  while (true) {
    // sleep at end
    const playerSettings = configPort.peek();

    if (playerSettings.log.silenced) {
      if (ns.isLogEnabled('sleep')) {
        ns.disableLog('ALL');
      }
    } else if (!ns.isLogEnabled('sleep')) {
      ns.enableLog('ALL');
    }

    if (!newTargetsPort.empty) {
      const newTargetsData = newTargetsPort.read();
      let newDeployers = 0;

      if (!lowRamMode) {
        while (newTargetsData.length) {
          const targetNode = newTargetsData.shift().node;
          if (ns.run(gameConfig.scripts.deployer, 1, targetNode)) {
            newDeployers += 1;
          }
        }
      } else {
        const targetNode = newTargetsData[0];
        if (ns.run(gameConfig.scripts.deployer, { preventDuplicates: true }, targetNode)) {
          newTargetsData.shift();
          newDeployers += 1;
        }
      }

      if (newDeployers > 0) {
        ns.tprint(`Started ${newDeployers} new deployers.`);
      }
    }

    await newTargetsPort.handle.nextWrite();
  }
}
