/** @param {NS} ns */
export async function main(ns) {
  const [port, forceStringify = true] = ns.args;

  if (port && typeof port === 'number' && port > 0) {
    const portData = ns.peek(port);

    ns.tprint(`Port ${port} current data:`);
    if (forceStringify) {
      const parsed = JSON.parse(portData);
      ns.tprint(JSON.stringify(parsed, null, 2));
    } else {
      ns.tprint(`${portData}`);
    }
  } else {
    tprint(`Missing or invalid port number given.`);
  }
}
