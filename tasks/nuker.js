import { gameConfig, portConfig } from 'config.js';
import { peekPortObject, tryWritePortObject } from "lib/Ports.js";

/** @param {NS} ns **/
export async function main(ns) {
  const configPort = ns.getPortHandle(portConfig.config);
  const playerSettings = peekPortObject(configPort);
  if (playerSettings.log.silenced) {
    ns.disableLog('ALL');
  } else {
    ns.enableLog('ALL');
  }

  const nuker = () => {
    const networkMap = JSON.parse(ns.read(gameConfig.files.netmap));
    const newTargetsPort = ns.getPortHandle(portConfig.newDeployerTargets);
    const playerExes = [];
    const deployerPort = ns.getPortHandle(portConfig.deployer);
    const deployerPortData = peekPortObject(deployerPort) || {};
    const existingTargets = Object.keys(deployerPortData);
    const newTargets = [];
    var playerRootLevel = 0;

    for (let i in gameConfig.accessExes) {
      if (ns.fileExists(gameConfig.accessExes[i], gameConfig.home)) {
        playerRootLevel += 1;
        playerExes.push(gameConfig.accessExes[i]);
      }
    }

    for (let node in networkMap) {
      if (node !== 'home' && !existingTargets.includes(node)) {
        if (networkMap[node].ports <= playerRootLevel) {
          if (playerExes.includes(gameConfig.accessExes[0])) {
            ns.brutessh(node);
          }
          if (playerExes.includes(gameConfig.accessExes[1])) {
            ns.ftpcrack(node);
          }
          if (playerExes.includes(gameConfig.accessExes[2])) {
            ns.relaysmtp(node);
          }
          if (playerExes.includes(gameConfig.accessExes[3])) {
            ns.httpworm(node);
          }
          if (playerExes.includes(gameConfig.accessExes[4])) {
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
      tryWritePortObject(newTargetsPort, newTargets);
    }
  };

  nuker();
}
