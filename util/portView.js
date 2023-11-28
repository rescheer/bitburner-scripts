import PortWrapper from 'lib/PortWrapper';

/** @param {NS} ns */
export async function main(ns) {
  const portNumber = ns.args[0];

  if (portNumber && typeof portNumber === 'number' && portNumber > 0) {
    const portData = new PortWrapper(ns, portNumber);

    ns.tprint(`Port ${portNumber} current data:`);
    ns.tprint(`${JSON.stringify(portData.peek(), null, 2)}`);
  }
}
