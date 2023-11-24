/** @param {NS} ns */
import { SCRIPTS, PORTS, DISABLE_LOGGING } from 'config.js';
import * as Ports from 'lib/Ports.js';

export async function main(ns) {
  ns.disableLog(DISABLE_LOGGING);

  const newTargetsPort = ns.getPortHandle(PORTS.newDeployerTargets);

  while (true) {
    if (!newTargetsPort.empty()) {
      const newTargetsData = Ports.readPortObject(newTargetsPort);
      var newDeployers = 0;

      while (newTargetsData.length) {
        const targetNode = newTargetsData.shift().node;
        ns.run(SCRIPTS.deployer, 1, targetNode);
        newDeployers += 1;
      }

      if (newDeployers > 0) {
        ns.tprint(`Started ${newDeployers} new deployers.`);
      }
    }

    await newTargetsPort.nextWrite();
  }
}
