/**
 * Checks if 'string' points to an existing property of 'obj'
 * @param {String} string
 * @param {Object} obj - A settings object or config object
 * @returns {String[]} - An array containing the keys or null if invalid
 */
function processString(string, obj) {
  const splitString = string.split('.');
  if (splitString.length === 2 && splitString[0] && splitString[1]) {
    if (
      Object.hasOwn(obj, splitString[0]) &&
      Object.hasOwn(obj[splitString[0]], splitString[1])
    ) {
      return splitString;
    }
  }
  return null;
}

/**
 * Returns a setting value from a settings file or from
 * its default value in a config object
 * @param {NS} ns
 * @param {String} keyString property to update (e.g. 'hacknet.enabled')
 * @param {(Object|String)} objOrFilename - a config object or settings file name
 * @returns the value of the setting
 */
export function getSetting(ns, keyString, objOrFilename) {
  const data =
    typeof objOrFilename === 'string'
      ? JSON.parse(ns.read(objOrFilename))
      : objOrFilename;
  const keys = processString(keyString, data);
  if (keys) {
    return data[keys[0]][keys[1]];
  }
  return null;
}

/**
 * Returns an object of all current settings
 * @param {NS} ns
 * @param {String} filename the settings filename
 * @returns {Object} an object containing all current settings
 */
export function getAllSettings(ns, filename) {
  return JSON.parse(ns.read(filename));
}

/**
 * Updates a setting to the value given
 * @param {NS} ns
 * @param {String} keyString property to update (e.g. 'hacknet.enabled')
 * @param {any} value the new value of the setting
 * @param {String} filename the settings filename
 * @returns {boolean} true if successful
 */
export function setSetting(ns, keyString, value, filename) {
  const fileData = JSON.parse(ns.read(filename));
  const keys = processString(keyString, fileData);
  if (keys) {
    fileData[keys[0]][keys[1]] = value;
    ns.write(filename, JSON.stringify(fileData, null, 2), 'w');
    return true;
  }
  return false;
}

/**
 * Resets a single setting to default
 * @param {NS} ns
 * @param {String} keyString property to reset (e.g. 'hacknet.enabled')
 * @param {String} filename the settings filename
 * @param {Object} configObj config.js object containing default values
 * @returns {any} the value the setting was reset to, or null if unsuccessful
 */
export function resetSetting(ns, keyString, filename, configObj) {
  const fileData = JSON.parse(ns.read(filename));
  const keys = processString(keyString, configObj);

  if (keys) {
    fileData[keys[0]][keys[1]] = configObj[keys[0]][keys[1]];
    ns.write(filename, JSON.stringify(fileData, null, 2), 'w');
    return configObj[keys[0]][keys[1]];
  }
  return null;
}

/**
 * Resets all settings to defaults
 * @param {NS} ns
 * @param {String} filename the settings filename
 * @param {Object} configObj config.js object containing default values
 */
export function resetAllSettings(ns, filename, configObj) {
  ns.write(filename, JSON.stringify(configObj, null, 2), 'w');
}
