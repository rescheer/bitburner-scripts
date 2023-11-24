import { playerConfig, gameConfig } from 'config.js';

/** @param {NS} ns **/
export async function main(ns) {
  if (playerConfig.log.silenced) {
    ns.disableLog('ALL');
  }

  const recursiveScan = (host, currentData = {}) => {
    const myConnections = ns.scan(host);
    const currentMoney = ns.getServerMoneyAvailable(host);
    const maxMoney = ns.getServerMaxMoney(host);
    const hackTime = ns.getHackTime(host);
    const growth = ns.getServerGrowth(host);
    const score = (maxMoney / hackTime) * (ns.hackAnalyzeChance(host) ^ 2);

    let newData = {
      ...currentData,
      [host]: {
        connections: myConnections,
        root: ns.hasRootAccess(host),
        currentMoney,
        maxMoney,
        hackLevel: ns.getServerRequiredHackingLevel(host),
        hackTime,
        minSecurity: ns.getServerMinSecurityLevel(host),
        growth,
        ports: ns.getServerNumPortsRequired(host),
        score,
      },
    };

    myConnections
      .filter((node) => !newData[node])
      .forEach((node) => {
        newData = recursiveScan(node, newData);
      });

    return newData;
  };

  const netmap = () => {
    const data = recursiveScan(gameConfig.home);
    ns.write(playerConfig.netmap.file, JSON.stringify(data, null, 2), 'w');
    ns.print(`netmap complete! ${Object.keys(data).length} nodes profiled.`);
  };

  netmap();
}
