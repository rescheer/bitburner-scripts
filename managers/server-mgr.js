import { RAM_PRICE_PER_GB, PORTS } from 'config.js';
import * as Ports from 'lib/Ports.js';

/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog('ALL');

  const statusPort = ns.getPortHandle(PORTS.status);
  const pServerPort = ns.getPortHandle(PORTS.pServer);
  const MONEY_USED = 0.75;
  const servers = { total: { ram: 0, cost: 0, nodes: 0 }, data: {} };
  const buyInfo = {
    maxServers: ns.getPurchasedServerLimit(),
    maxRam: ns.getPurchasedServerMaxRam(),
  };

  const myMoney = () => {
    return ns.getServerMoneyAvailable('home');
  };

  const getRamNeeded = () => {
    const key = PORTS.statusKeys.missingRam;
    return Number(Ports.peekPortObject(statusPort, key)) || 0;
  };

  const updateRamNeeded = (ramAdded) => {
    const key = PORTS.statusKeys.missingRam;
    const oldValue = Ports.peekPortObject(statusPort, key) || 0;
    const newValue = Math.max(oldValue - ramAdded, 0);

    Ports.updatePortObjectKey(statusPort, key, newValue);
  };

  const refreshPurchasedServers = () => {
    const portKey = PORTS.pServerKeys.serverData;
    servers.total.ram = 0;

    ns.getPurchasedServers().forEach((server) => {
      const ram = ns.getServerMaxRam(server);
      servers.data[server] = { ram };
      servers.total.ram += ram;
    });

    servers.total.cost = servers.total.ram * RAM_PRICE_PER_GB;
    servers.total.nodes = Object.keys(servers.data).length;

    Ports.updatePortObjectKey(pServerPort, portKey, servers);
  };

  const refreshBuyInfo = () => {
    const portKey = PORTS.pServerKeys.buyData;

    buyInfo.maxServers = ns.getPurchasedServerLimit() || 0;
    buyInfo.maxRam = ns.getPurchasedServerMaxRam() || 2;

    Ports.updatePortObjectKey(pServerPort, portKey, buyInfo);
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

  ns.clearPort(PORTS.status);
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
    await ns.sleep(5000);
    refreshBuyInfo();
    refreshPurchasedServers();

    if (getRamNeeded() > 0) {
      const bestAffordable = {};

      const upgradeResult = checkUpgrades(
        buyInfo.maxRam,
        myMoney() * MONEY_USED
      );
      if (upgradeResult.cost > 0) {
        bestAffordable.upgrade = upgradeResult;
      }

      if (isAbleToPurchase()) {
        const purchaseResult = checkPurchases(
          buyInfo.maxRam,
          myMoney() * MONEY_USED
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
  }
}
