import { playerConfig, gameConfig, portConfig } from 'config.js';
import * as Settings from 'lib/Settings.js';
import * as Ports from 'lib/Ports.js';

/** @param {NS} ns */
export async function main(ns) { // (6.7gb)
  const configPort = ns.getPortHandle(portConfig.config);
  const lowRamMode = ns.getServerMaxRam(gameConfig.home) <= 32;
  const flags = ns.flags([
    ['d', false],
    ['defaults', false],
  ]);

  if (lowRamMode) {
    ns.tprint(`Starting in Low Ram mode.`);
  }

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

  // network manager (2.6gb)
  if (ns.run(gameConfig.scripts.network, { preventDuplicates: true })) {
    ns.tprint(`Network manager ready.`);
  }

  // hacking manager (2.7gb)
  if (ns.run(gameConfig.scripts.hacking, { preventDuplicates: true })) {
    ns.tprint(`Hacking manager ready.`);
  }

  // server manager (6.95gb)
  if (!lowRamMode && ns.run(gameConfig.scripts.server, { preventDuplicates: true })) {
    ns.tprint(`Server manager ready.`);
  }

  // hacknet manager (5.7gb)
  if (!lowRamMode && ns.run(gameConfig.scripts.hacknet, { preventDuplicates: true })) {
    ns.tprint(`Hacknet manager ready.`);
  }

  // overview (eventually UI manager) (1.7gb)
  if (!lowRamMode && ns.run(gameConfig.scripts.overview, { preventDuplicates: true })) {
    ns.tprint(`Overview ready.`);
  }
}
