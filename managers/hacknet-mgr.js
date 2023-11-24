/** @param {NS} ns **/
export async function main(ns) {
  function myMoney() {
    return ns.getServerMoneyAvailable('home');
  }

  // Don't spend more than this percent of total money
  const MONEY_USED = 0.25;
  var nodes = 0;
  var ref = 0;

  ns.disableLog('ALL');

  while (true) {
    await ns.sleep(5000);

    //buy a node if we have more than twice the money needed
    if (ns.hacknet.getPurchaseNodeCost() < myMoney() * MONEY_USED) {
      ref = ns.hacknet.purchaseNode();
      ns.print('bought node hn-' + ref);
    }
    nodes = ns.hacknet.numNodes();

    for (var i = 0; i < nodes; i++) {
      //check if nodes level is a multiple of 10
      var mod = ns.hacknet.getNodeStats(i).level % 10;

      //buy level node to the nearest multiple of 10 if we have double the money needed
      if (
        ns.hacknet.getLevelUpgradeCost(i, 10 - mod) <
        myMoney() * MONEY_USED
      ) {
        ns.hacknet.upgradeLevel(i, 10 - mod);
        ns.print('node hn-' + i + ' leveled up');
      }

      //same for ram
      if (ns.hacknet.getRamUpgradeCost(i) < myMoney() * MONEY_USED) {
        ns.hacknet.upgradeRam(i);
        ns.print('node hn-' + i + ' ram upgraded');
      }

      //and cores
      if (ns.hacknet.getCoreUpgradeCost(i) < myMoney() * MONEY_USED) {
        ns.hacknet.upgradeCore(i);
        ns.print('node hn-' + i + ' core upgraded');
      }
    }
  }
}
