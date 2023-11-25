/** @param {NS} ns */
import { gameConfig, portConfig } from 'config.js';
import { peekPortObject, readPortObject } from "lib/Ports.js";

export async function main(ns) {
  const configPort = ns.getPortHandle(portConfig.config);
  const newTargetsPort = ns.getPortHandle(portConfig.newDeployerTargets);

  while (true) {
    // sleep at end
    const playerSettings = peekPortObject(configPort);
    if (playerSettings.log.silenced) {
      ns.disableLog('ALL');
    } else {
      ns.enableLog('ALL');
    }

    if (!newTargetsPort.empty()) {
      const newTargetsData = readPortObject(newTargetsPort);
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
