import { portConfig } from 'cfg/config';
import PortWrapper from 'lib/PortWrapper';

/** @param {NS} ns */
export async function main(ns) {
  const configPort = new PortWrapper(ns, portConfig.config);

  function myMoney() {
    return ns.getServerMoneyAvailable('home');
  }

  while (true) {
    const playerSettings = configPort.peek();
    const { enabled, moneyUsed } = playerSettings.hacknet;
    if (playerSettings.log.silenced) {
      if (ns.isLogEnabled('sleep')) {
        ns.disableLog('ALL');
      }
    } else if (!ns.isLogEnabled('sleep')) {
      ns.enableLog('ALL');
    }

    await ns.sleep(5000);

    if (enabled) {
      let nodes = 0;

      // Buy a new node
      if (ns.hacknet.getPurchaseNodeCost() < myMoney() * moneyUsed) {
        ns.hacknet.purchaseNode();
      }
      nodes = ns.hacknet.numNodes();

      for (let i = 0; i < nodes; i += 1) {
        // Upgrade level to next mult of 10
        const mod = ns.hacknet.getNodeStats(i).level % 10;
        if (ns.hacknet.getLevelUpgradeCost(i, 10 - mod) < myMoney() * moneyUsed) {
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
