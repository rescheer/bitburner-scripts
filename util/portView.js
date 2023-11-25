/** @param {NS} ns */
export async function main(ns) {
  const port = ns.args[0];

  if (port && typeof port === 'number' && port > 0) {
    const portData = ns.peek(port);

    ns.tprint(`Port ${port} current data:`);
    if (typeof portData === 'object') {
      ns.tprint(JSON.stringify(portData, null, 2));
    } else {
      ns.tprint(`${portData}`);
    }
  } else {
    tprint(`Missing or invalid port number given.`);
  }
}
