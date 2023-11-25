import { gameConfig, portConfig } from 'config.js';
import { peekPortObject, readPortObject } from 'lib/Ports.js';

/** @param {NS} ns */
export async function main(ns) {
  const configPort = ns.getPortHandle(portConfig.config);
  const networkMap = JSON.parse(ns.read(gameConfig.files.netmap));
  const newTargetsPort = ns.getPortHandle(portConfig.newDeployerTargets);

  while (true) {
    // sleep at end
    const playerSettings = peekPortObject(configPort);
    const homeMaxRam = networkMap[gameConfig.home].maxRam;
    const deployerRamUse = ns.getScriptRam(gameConfig.scripts.deployer);
    const { reservedRamPercent, reservedRamGb } = playerSettings.home;
    const homeUnreservedRam =
      homeMaxRam - Math.max(reservedRamPercent * homeMaxRam, reservedRamGb);
    var maxDeployerThreads = Math.floor(homeUnreservedRam / deployerRamUse);

    if (playerSettings.log.silenced) {
      if (ns.isLogEnabled('ALL')) {
        ns.disableLog('ALL');
      }
    } else {
      if (!ns.isLogEnabled('ALL')) {
        ns.enableLog('ALL');
      }
    }

    if (!newTargetsPort.empty()) {
      const newTargetsData = readPortObject(newTargetsPort);
      var newDeployers = 0;

      while (newTargetsData.length) {
        if (maxDeployerThreads > 0) {
          const targetNode = newTargetsData.shift().node;
          ns.run(gameConfig.scripts.deployer, 1, targetNode);
          newDeployers += 1;
          maxDeployerThreads -= 1;
        }
      }

      if (newDeployers > 0) {
        if (newTargetsData.length) {
          ns.tprint(
            `Started ${newDeployers}/${
              newDeployers + newTargetsData.length
            } new deployer(s) due to low RAM.`
          );
        } else {
          ns.tprint(`Started ${newDeployers} new deployers.`);
        }
      }
    }

    await newTargetsPort.nextWrite();
  }
}
