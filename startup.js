/** @param {NS} ns */
import { playerConfig } from './config';

export async function main(ns) {
  // overview (eventually UI manager)
  if (ns.run(playerConfig.scripts.overview, { preventDuplicates: true })) {
    ns.tprint(`Overview ready.`);
  }

  // network manager
  if (ns.run(playerConfig.scripts.network, { preventDuplicates: true })) {
    ns.tprint(`Network manager ready.`);
  }

  // hacknet manager
  if (ns.run(playerConfig.scripts.hacknet, { preventDuplicates: true })) {
    ns.tprint(`Hacknet manager ready.`);
  }

  // server manager
  if (ns.run(playerConfig.scripts.server, { preventDuplicates: true })) {
    ns.tprint(`Server manager ready.`);
  }

  // hacking manager
  if (ns.run(playerConfig.scripts.hacking, { preventDuplicates: true })) {
    ns.tprint(`Hacking manager ready.`);
  }
}
