import { playerConfig } from 'config.js';

/** @param {NS} ns **/
export async function main(ns) {
  function myMoney() {
    return ns.getServerMoneyAvailable('home');
  }

  const { enabled, moneyUsed } = playerConfig.hacknet;
  if (playerConfig.log.silenced) {
    ns.disableLog('ALL');
  }

  while (true) {
    await ns.sleep(5000);
    if (enabled) {
      var nodes = 0;

      // Buy a new node
      if (ns.hacknet.getPurchaseNodeCost() < myMoney() * moneyUsed) {
        ns.hacknet.purchaseNode();
      }
      nodes = ns.hacknet.numNodes();

      for (var i = 0; i < nodes; i++) {
        // Upgrade level to next mult of 10
        var mod = ns.hacknet.getNodeStats(i).level % 10;
        if (
          ns.hacknet.getLevelUpgradeCost(i, 10 - mod) <
          myMoney() * moneyUsed
        ) {
          ns.hacknet.upgradeLevel(i, 10 - mod);
        }

        // Upgrade RAM
        if (ns.hacknet.getRamUpgradeCost(i) < myMoney() * moneyUsed) {
          ns.hacknet.upgradeRam(i);
        }

        // Upgrade cores
        if (ns.hacknet.getCoreUpgradeCost(i) < myMoney() * moneyUsed) {
          ns.hacknet.upgradeCore(i);
        }
      }
    }
  }
}
