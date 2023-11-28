import { portConfig } from 'cfg/config';
import * as Ports from 'lib/PortWrapper';
import Deployer from 'lib/Deployer';

/** @param {NS} ns */
export async function main(ns) {
  const test = new Deployer(ns, 'none');
  test.getns().alert('c00l');
}
