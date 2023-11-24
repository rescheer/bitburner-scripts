/** @param {NS} ns */

export async function main(ns) {
  const port = ns.args[0];

  if (port && typeof port === 'number' && port > 0) {
    const portData = ns.peek(port);

    ns.tprint(`Port ${port} current data:`);
    ns.tprint(`${portData}`);
  } else {
    tprint(`Missing or invalid port number given.`);
  }
}
