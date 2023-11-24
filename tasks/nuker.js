import {
  HOME,
  NETWORK_MAP,
  ACCESS_EXES,
  PORTS,
  DISABLE_LOGGING,
} from 'config.js';
import * as Ports from 'lib/Ports.js';

/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog(DISABLE_LOGGING);

  const nuker = () => {
    const networkMap = JSON.parse(ns.read(NETWORK_MAP));
    const newTargetsPort = ns.getPortHandle(PORTS.newDeployerTargets);
    const playerExes = [];
    const deployerPort = ns.getPortHandle(PORTS.deployer);
    const deployerPortData = Ports.peekPortObject(deployerPort) || {};
    const existingTargets = Object.keys(deployerPortData);
    const newTargets = [];
    var playerRootLevel = 0;

    for (let i in ACCESS_EXES) {
      if (ns.fileExists(ACCESS_EXES[i], HOME)) {
        playerRootLevel += 1;
        playerExes.push(ACCESS_EXES[i]);
      }
    }

    for (let node in networkMap) {
      if (node !== 'home' && !existingTargets.includes(node)) {
        if (networkMap[node].ports <= playerRootLevel) {
          if (playerExes.includes(ACCESS_EXES[0])) {
            ns.brutessh(node);
          }
          if (playerExes.includes(ACCESS_EXES[1])) {
            ns.ftpcrack(node);
          }
          if (playerExes.includes(ACCESS_EXES[2])) {
            ns.relaysmtp(node);
          }
          if (playerExes.includes(ACCESS_EXES[3])) {
            ns.httpworm(node);
          }
          if (playerExes.includes(ACCESS_EXES[4])) {
            ns.sqlinject(node);
          }
          ns.nuke(node);

          if (networkMap[node].maxMoney > 0) {
            const score = networkMap[node].score;
            newTargets.push({ node, score });
          }
        }
      }
    }

    if (newTargets.length) {
      // Sort descending
      newTargets.sort((a, b) => b.score - a.score);
      Ports.tryWritePortObject(newTargetsPort, newTargets);
    }
  };

  nuker();
}
