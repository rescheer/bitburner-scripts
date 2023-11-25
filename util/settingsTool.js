import * as Settings from 'lib/Settings.js';
import { gameConfig, playerConfig } from 'config.js';

/** @param {NS} ns */
export async function main(ns) {
  const argArray = ns.args;
  const { playerSettings: playerSettingsFile } = gameConfig.files;
  var result;
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
        ns.tprint(`Current Settings:`);
        ns.tprint(JSON.stringify(result, null, 2));
      }
      break;
    
    case 'set':
      if (argArray[1]) {
        result = Settings.setSetting(
          ns,
          argArray[1],
          argArray[2],
          playerSettingsFile
        );
        if (result) {
          ns.tprint(`${argArray[1]} set to value: ${argArray[2]}`);
        }
      } else {
        ns.tprint('SET Usage: set <setting> <value>');
      }
      break;
    
    case 'reset':
      if (argArray[1]) {
        result = Settings.resetSetting(
          ns,
          argArray[1],
          playerSettingsFile,
          playerConfig
        );
        if (result !== null) {
          ns.tprint(`${argArray[1]} reset to default value: ${result}`);
        }
      } else {
        ns.tprint('RESET Usage: reset <setting>');
      }
      break;
    
    case 'resetall':
      Settings.resetAllSettings(ns, playerSettingsFile, playerConfig);
      ns.tprint(`All settings returned to default values.`);
      break;
    
    default:
      ns.tprint('GET Usage: get <setting>');
      ns.tprint('SET Usage: set <setting> <value>');
      ns.tprint('RESET Usage: reset <setting>');
      ns.tprint('RESET ALL Usage: resetall');
      break;
  }
}
