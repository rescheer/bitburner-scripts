import { gameConfig, portConfig } from 'config.js';
import { peekPortObject, updatePortObjectKey } from "lib/Ports.js";

/** @param {NS} ns **/
export async function main(ns) {
  const configPort = ns.getPortHandle(portConfig.config);
  const statusPort = ns.getPortHandle(portConfig.status);
  const pServerPort = ns.getPortHandle(portConfig.pServer);

  const servers = { total: { ram: 0, cost: 0, nodes: 0 }, data: {} };
  const buyInfo = {
    maxServers: ns.getPurchasedServerLimit(),
    maxRam: ns.getPurchasedServerMaxRam(),
  };

  const myMoney = () => {
    return ns.getServerMoneyAvailable('home');
  };

  const getRamNeeded = () => {
    const key = portConfig.statusKeys.missingRam;
    return Number(peekPortObject(statusPort, key)) || 0;
  };

  const updateRamNeeded = (ramAdded) => {
    const key = portConfig.statusKeys.missingRam;
    const oldValue = peekPortObject(statusPort, key) || 0;
    const newValue = Math.max(oldValue - ramAdded, 0);

    updatePortObjectKey(statusPort, key, newValue);
  };

  const refreshPurchasedServers = () => {
    const portKey = portConfig.pServerKeys.serverData;
    const ramCostPerGb = ns.getPurchasedServerCost(2) / 2;
    servers.total.ram = 0;

    ns.getPurchasedServers().forEach((server) => {
      const ram = ns.getServerMaxRam(server);
      servers.data[server] = { ram };
      servers.total.ram += ram;
    });

    servers.total.cost = servers.total.ram * ramCostPerGb;
    servers.total.nodes = Object.keys(servers.data).length;

    updatePortObjectKey(pServerPort, portKey, servers);
  };

  const refreshBuyInfo = () => {
    const portKey = portConfig.pServerKeys.buyData;

    buyInfo.maxServers = ns.getPurchasedServerLimit() || 0;
    buyInfo.maxRam = ns.getPurchasedServerMaxRam() || 2;

    updatePortObjectKey(pServerPort, portKey, buyInfo);
  };

  const isAbleToPurchase = () => {
    const numPurchasedServers = Object.keys(servers.data).length;
    return numPurchasedServers < buyInfo.maxServers;
  };

  const checkPurchases = (maxRam, maxMoney) => {
    const best = { ram: -1, cost: -1, ratio: -1 };
    for (let ram = maxRam; ram >= 2; ram /= 2) {
      const cost = ns.getPurchasedServerCost(ram);

      if (cost < maxMoney) {
        best.ram = ram;
        best.cost = cost;
        best.ratio = ram / cost;
        break;
      }
    }

    return best;
  };

  const checkUpgrades = (maxRam, maxMoney) => {
    const best = { name: '', ram: -1, cost: -1, ratio: -1 };

    for (const server in servers.data) {
      if (server !== 'total') {
        const currentRam = servers.data[server].ram;
        for (let ram = currentRam * 2; ram <= maxRam; ram *= 2) {
          const cost = ns.getPurchasedServerUpgradeCost(server, ram);
          if (cost < maxMoney) {
            best.name = server;
            best.ram = ram;
            best.cost = cost;
            best.ratio = (ram - currentRam) / cost;
          } else if (cost > maxMoney) {
            break;
          }
        }
      }
    }

    return best;
  };

  ns.clearPort(portConfig.status);
  refreshPurchasedServers();
  ns.clearLog();
  ns.print(
    `> Total Server Ram: ${ns.formatRam(servers.total.ram, 0)} across ${
      servers.total.nodes
    } servers`
  );
  ns.print(`> Ram Requested: ${ns.formatRam(getRamNeeded())}`);
  ns.print(`> Total spent: ${ns.formatNumber(servers.total.cost)}`);
  // ns.tail();

  while (true) {
    // sleep at end
    const playerSettings = peekPortObject(configPort);
    const { moneyUsed } = playerSettings.pServer;
    if (playerSettings.log.silenced) {
      if (ns.isLogEnabled('sleep')) {
        ns.disableLog('ALL');
      }
    } else {
      if (!ns.isLogEnabled('sleep')) {
        ns.enableLog('ALL');
      }
    }
    
    refreshBuyInfo();
    refreshPurchasedServers();

    if (getRamNeeded() > 0) {
      const bestAffordable = {};

      const upgradeResult = checkUpgrades(
        buyInfo.maxRam,
        myMoney() * moneyUsed
      );
      if (upgradeResult.cost > 0) {
        bestAffordable.upgrade = upgradeResult;
      }

      if (isAbleToPurchase()) {
        const purchaseResult = checkPurchases(
          buyInfo.maxRam,
          myMoney() * moneyUsed
        );

        if (purchaseResult.cost > 0) {
          bestAffordable.purchased = purchaseResult;
        }
      }

      // If both are affordable, upgrade first. Otherwise,
      // purchase a new server.
      if (bestAffordable.purchased && bestAffordable.upgrade) {
        const { upgrade } = bestAffordable;

        updateRamNeeded(upgrade.ram - ns.getServerMaxRam(upgrade.name));
        ns.upgradePurchasedServer(upgrade.name, upgrade.ram);
      } else if (bestAffordable.purchased || bestAffordable.upgrade) {
        const option = bestAffordable.purchased
          ? bestAffordable.purchased
          : bestAffordable.upgrade;

        if (option.name) {
          updateRamNeeded(option.ram - ns.getServerMaxRam(option.name));
          ns.upgradePurchasedServer(option.name, option.ram);
        } else {
          ns.purchaseServer(`pserv-0`, option.ram);
          updateRamNeeded(option.ram);
        }
      }
    }

    ns.clearLog();
    ns.print(
      `> Total Server Ram: ${ns.formatRam(servers.total.ram, 0)} in ${
        servers.total.nodes
      }/${buyInfo.maxServers} servers.`
    );
    ns.print(`> Ram Requested: ${ns.formatRam(getRamNeeded())}`);
    ns.print(`> Total spent: ${ns.formatNumber(servers.total.cost)}`);

    await ns.sleep(5000);
  }
}
