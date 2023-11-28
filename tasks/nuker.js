import { gameConfig, portConfig } from 'cfg/config';
import PortWrapper from 'lib/PortWrapper';

/** @param {NS} ns */
export async function main(ns) {
  const configPort = new PortWrapper(ns, portConfig.config);
  const playerSettings = configPort.peek();
  try {
    if (playerSettings.log.silenced) {
      ns.disableLog('ALL');
    } else {
      ns.enableLog('ALL');
    }
  } catch (error) {
    ns.disableLog('ALL');
  }

  const nuker = () => {
    const networkMap = JSON.parse(ns.read(gameConfig.files.netmap));
    const newTargetsPort = new PortWrapper(ns, portConfig.newDeployerTargets);
    const deployerPort = new PortWrapper(ns, portConfig.deployer);
    const deployerPortData = deployerPort.peek();
    const existingTargets = Object.keys(deployerPortData);

    const playerHackingLevel = ns.getHackingLevel();
    const playerExes = [];
    const newTargets = [];
    let playerRootLevel = 0;

    gameConfig.accessExes.forEach((exe) => {
      if (ns.fileExists(exe, gameConfig.home)) {
        playerRootLevel += 1;
        playerExes.push(exe);
      }
    });

    Object.entries(networkMap).forEach(([node, nodeData]) => {
      if (node !== 'home' && !existingTargets.includes(node)) {
        if (nodeData.ports <= playerRootLevel) {
          const { score } = nodeData;
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

          if (nodeData.maxMoney > 0 && score > 0 && nodeData.hackLevel <= playerHackingLevel) {
            newTargets.push({ node, score });
          }
        }
      }
    });

    if (newTargets.length) {
      // Sort descending
      newTargets.sort((a, b) => b.score - a.score);
      ns.print(JSON.stringify(newTargets, null, 2));
      newTargetsPort.write(newTargets);
    }
  };

  nuker();
}
