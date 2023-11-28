import PortWrapper from 'lib/PortWrapper';
import { portConfig } from 'cfg/config';

export default class Deployer {
  // Private Properties
  #ns;

  #target;

  /** @param {NS} ns  */
  constructor(ns, target) {
    this.#ns = ns;
    this.#target = target;
  }
}
