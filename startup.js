import { playerConfig, gameConfig, portConfig } from './config';
import * as Settings from 'lib/Settings.js';
import * as Ports from 'lib/Ports.js';

/** @param {NS} ns */
export async function main(ns) {
  const configPort = ns.getPortHandle(portConfig.config);
  const flags = ns.flags([
    ['d', false],
    ['defaults', false],
  ]);
  // Load settings from file or get defaults

  if (
    flags.d ||
    flags.defaults ||
    !ns.fileExists(gameConfig.files.playerSettings)
  ) {
    Settings.resetAllSettings(
      ns,
      gameConfig.files.playerSettings,
      playerConfig
    );
    if (Ports.tryWritePortObject(configPort, playerConfig)) {
      ns.tprint('Starting with default settings.');
    } else {
      ns.tprint('Error loading settings!');
      return;
    }
  } else {
    const settings = Settings.getAllSettings(
      ns,
      gameConfig.files.playerSettings
    );
    if (Ports.tryWritePortObject(configPort, settings)) {
      ns.tprint('Starting with saved settings.');
    } else {
      ns.tprint('Error loading settings!');
      return;
    }
  }

  // overview (eventually UI manager)
  if (ns.run(gameConfig.scripts.overview, { preventDuplicates: true })) {
    ns.tprint(`Overview ready.`);
  }

  // network manager
  if (ns.run(gameConfig.scripts.network, { preventDuplicates: true })) {
    ns.tprint(`Network manager ready.`);
  }

  // hacknet manager
  if (ns.run(gameConfig.scripts.hacknet, { preventDuplicates: true })) {
    ns.tprint(`Hacknet manager ready.`);
  }

  // server manager
  if (ns.run(gameConfig.scripts.server, { preventDuplicates: true })) {
    ns.tprint(`Server manager ready.`);
  }

  // hacking manager
  if (ns.run(gameConfig.scripts.hacking, { preventDuplicates: true })) {
    ns.tprint(`Hacking manager ready.`);
  }
}
