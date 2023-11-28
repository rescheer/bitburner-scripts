import { portConfig } from 'cfg/config';
import PortWrapper from 'lib/PortWrapper';

/** @param {NS} ns * */
export async function main(ns) {
  // eslint-disable-next-line no-eval
  const doc = eval('document');
  const hookHeaders = doc.getElementById('overview-extra-hook-0');
  const hookValues = doc.getElementById('overview-extra-hook-1');
  const statusPort = new PortWrapper(ns, portConfig.status);
  const deployerPort = new PortWrapper(ns, portConfig.deployer);
  const configPort = new PortWrapper(ns, portConfig.config);

  while (true) {
    const playerSettings = configPort.peek();
    if (playerSettings.log.silenced) {
      if (ns.isLogEnabled('sleep')) {
        ns.disableLog('ALL');
      }
    } else if (!ns.isLogEnabled('sleep')) {
      ns.enableLog('ALL');
    }

    await ns.sleep(1000);

    try {
      const headers = [];
      const values = [];

      headers.push('Deploys');
      const deployerData = deployerPort.peek();
      const numDeploys = deployerData ? Object.keys(deployerData).length : 0;
      values.push(numDeploys);

      headers.push('Income');
      values.push(`${ns.formatNumber(ns.getTotalScriptIncome()[0], 1)}/s`);

      headers.push('-');
      values.push('-');

      headers.push('RamDfct');
      const missingRam = statusPort.peekValue(portConfig.statusKeys.missingRam) || 0;
      values.push(ns.formatRam(missingRam));

      hookHeaders.innerText = headers.join(' \n');
      hookValues.innerText = values.join('\n');
    } catch (err) {
      ns.print(`ERROR: Update Skipped: ${String(err)}`);
    }
  }
}
