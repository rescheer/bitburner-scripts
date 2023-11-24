/** @param {NS} ns */
import { SCRIPTS } from './config';

export async function main(ns) {

  // overview
  if (ns.run(SCRIPTS.overview, { preventDuplicates: true })) {
    ns.tprint(`Overview started.`);
  }

  // network manager
  if (ns.run(SCRIPTS.network, { preventDuplicates: true })) {
    ns.tprint(`Network Manager started.`);
  }

  // hacknet manager
  /* if (ns.run(SCRIPTS.hacknet, { preventDuplicates: true })) {
    ns.tprint(`Hacknet manager started.`);
  } */

  // server manager
  if (ns.run(SCRIPTS.server, { preventDuplicates: true })) {
    ns.tprint(`Server manager started.`);
  }

  // hacking manager
  if (ns.run(SCRIPTS.hacking, { preventDuplicates: true })) {
    ns.tprint(`Hacking manager started.`);
  }
}
