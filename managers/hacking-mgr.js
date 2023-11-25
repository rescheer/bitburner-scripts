/** @param {NS} ns */
import { playerConfig, gameConfig, portConfig } from 'config.js';
import * as Ports from 'lib/Ports.js';

export async function main(ns) {
  if (playerConfig.log.silenced) {
    ns.disableLog('ALL');
  }

  const newTargetsPort = ns.getPortHandle(portConfig.newDeployerTargets);

  while (true) {
    // sleep at end
    if (!newTargetsPort.empty()) {
      const newTargetsData = Ports.readPortObject(newTargetsPort);
      var newDeployers = 0;

      while (newTargetsData.length) {
        const targetNode = newTargetsData.shift().node;
        ns.run(gameConfig.scripts.deployer, 1, targetNode);
        newDeployers += 1;
      }

      if (newDeployers > 0) {
        ns.tprint(`Started ${newDeployers} new deployers.`);
      }
    }

    await newTargetsPort.nextWrite();
  }
}
