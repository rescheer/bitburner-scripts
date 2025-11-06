import * as Settings from 'lib/Settings';
import { gameConfig, playerConfig, portConfig } from 'cfg/config';
import PortWrapper from 'lib/PortWrapper';

/** @param {NS} ns */
export async function main(ns) {
  const argArray = ns.args;
  const { playerSettings: playerSettingsFile } = gameConfig.files;
  const settingsPort = new PortWrapper(ns, portConfig.config);
  let result;
  let changes = false;

  const updatePort = (settingsObject) => settingsPort.write(settingsObject);

  switch (argArray[0]) {
    case 'get':
      if (argArray[1]) {
        result = Settings.getSetting(ns, argArray[1], playerSettingsFile);
        if (result !== null) {
          ns.tprint(`${argArray[1]} current value: ${result}`);
        } else {
          ns.tprint(`Could not retrieve setting: ${argArray[1]}`);
        }
      } else {
        result = Settings.getAllSettings(ns, playerSettingsFile);
        ns.tprint('Current Settings:');
        ns.tprint(JSON.stringify(result, null, 2));
      }
      break;

    case 'set':
      if (argArray[1]) {
        result = Settings.setSetting(ns, argArray[1], argArray[2], playerSettingsFile);
        if (result) {
          ns.tprint(`${argArray[1]} set to value: ${argArray[2]}`);
          changes = true;
        }
      } else {
        ns.tprint('SET Usage: set <setting> <value>');
      }
      break;

    case 'reset':
      if (argArray[1]) {
        result = Settings.resetSetting(ns, argArray[1], playerSettingsFile, playerConfig);
        if (result !== null) {
          ns.tprint(`${argArray[1]} reset to default value: ${result}`);
          changes = true;
        }
      } else {
        ns.tprint('RESET Usage: reset <setting>');
      }
      break;

    case 'resetall':
      Settings.resetAllSettings(ns, playerSettingsFile, playerConfig);
      ns.tprint('All settings returned to default values.');
      changes = true;
      break;

    case 'load':
      if (updatePort(Settings.getAllSettings(ns, playerSettingsFile))) {
        ns.tprint('Current settings loaded from file.');
      }
      break;

    default:
      ns.tprint('LOAD Usage: settings load');
      ns.tprint('GET Usage: settings get <setting>');
      ns.tprint('SET Usage: settings set <setting> <value>');
      ns.tprint('RESET Usage: settings reset <setting>');
      ns.tprint('RESET ALL Usage: settings resetall');
      break;
  }
  if (changes) {
    const fileData = JSON.parse(ns.read(playerSettingsFile));
    settingsPort.write(fileData);
  }
}
