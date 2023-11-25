import { portConfig } from 'config.js';
import { peekPortObject } from "lib/Ports.js";

/** @param {NS} ns **/
export async function main(ns) {
  const doc = eval('document');
  const hookHeaders = doc.getElementById('overview-extra-hook-0');
  const hookValues = doc.getElementById('overview-extra-hook-1');
  const statusPort = ns.getPortHandle(portConfig.status);
  const deployerPort = ns.getPortHandle(portConfig.deployer);

  while (true) {
    const configPort = ns.getPortHandle(portConfig.config);
    const playerSettings = peekPortObject(configPort);
    if (playerSettings.log.silenced) {
      ns.disableLog('ALL');
    } else {
      ns.enableLog('ALL');
    }

    await ns.sleep(1000);

    try {
      const headers = [];
      const values = [];

      headers.push('Deploys');
      const deployerData = peekPortObject(deployerPort);
      const numDeploys = deployerData ? Object.keys(deployerData).length : 0;
      values.push(numDeploys);

      headers.push('Income');
      values.push(ns.formatNumber(ns.getTotalScriptIncome()[0], 1) + '/s');

      headers.push('-');
      values.push('-');

      headers.push('RamDfct');
      const missingRam =
        peekPortObject(statusPort, portConfig.statusKeys.missingRam) || 0;
      values.push(ns.formatRam(missingRam));

      hookHeaders.innerText = headers.join(' \n');
      hookValues.innerText = values.join('\n');
    } catch (err) {
      ns.print('ERROR: Update Skipped: ' + String(err));
    }
  }
}
