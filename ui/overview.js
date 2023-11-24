import { playerConfig, portConfig } from 'config.js';
import * as Ports from 'lib/Ports.js';

/** @param {NS} ns **/
export async function main(ns) {
  if (playerConfig.log.silenced) {
    ns.disableLog('ALL');
  }

  const doc = eval('document');
  const hookHeaders = doc.getElementById('overview-extra-hook-0');
  const hookValues = doc.getElementById('overview-extra-hook-1');
  const statusPort = ns.getPortHandle(portConfig.status);
  const deployerPort = ns.getPortHandle(portConfig.deployer);
  while (true) {
    await ns.sleep(1000);
    try {
      const headers = [];
      const values = [];

      headers.push('Deploys');
      const deployerData = Ports.peekPortObject(deployerPort);
      const numDeploys = deployerData ? Object.keys(deployerData).length : 0;
      values.push(numDeploys);

      headers.push('Income');
      values.push(ns.formatNumber(ns.getTotalScriptIncome()[0], 1) + '/s');

      headers.push('-');
      values.push('-');

      headers.push('RamDfct');
      const missingRam =
        Ports.peekPortObject(statusPort, portConfig.statusKeys.missingRam) || 0;
      values.push(ns.formatRam(missingRam));

      hookHeaders.innerText = headers.join(' \n');
      hookValues.innerText = values.join('\n');
    } catch (err) {
      ns.print('ERROR: Update Skipped: ' + String(err));
    }
  }
}
