/** @param {NS} ns **/
export async function main(ns) {
  const target = ns.args[0];

  if (target && typeof target === 'string') {
    await ns.weaken(target);
  }
}