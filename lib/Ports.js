/**
 * Destructively reads the value of a port as JSON and returns an Object/Array.
 * @param {NetscriptPort} handle - Handle of the port to be read
 * @returns {Object | Array | null} Returns null if port is empty or invalid JSON
 */
export function readPortObject(handle) {
  if (!handle.empty()) {
    // If port has data, peek it non-destructively
    const data = handle.peek();

    try {
      // Try to parse first so an error will prevent the clear() call
      const objData = JSON.parse(data);
      handle.clear();
      return objData;
    } catch (error) {
      // We could put the error into a port with a script that waits
      // for a write and prints it to a log to avoid having to pass ns
      // to this function
      // But for now we'll ignore the error and handle null in the calling
      // function
      return null;
    }
  }
  return null;
}

/**
 * Non-destructively reads Object/Array data from a port. Optionally returns
 * a single key's value.
 * @param {NetscriptPort} handle - Handle of the port to be read
 * @param {String} [key] - A specific key within the Object whose value to return
 * @returns {Object | Array | null} Returns null if port is empty or invalid JSON
 */
export function peekPortObject(handle, key) {
  if (!handle.empty()) {
    const data = handle.peek();

    try {
      const objData = JSON.parse(data);
      return key ? objData[key] : objData;
    } catch (error) {
      // We could put the error into a port with a script that waits
      // for a write and prints it to a log to avoid having to pass ns
      // to this function
      // But for now we'll ignore the error and handle null in the calling
      // function
      return null;
    }
  }
  return null;
}

/**
 * Attempts to write an Object/Array into a port as a JSON string.
 * @param {NetscriptPort} handle Handle of the port to be written to
 * @param {Object | Array} objData The Object or Array to write to the port
 * @param {boolean=true} overwrite If false, function will fail if port contains data
 * @returns {boolean} Returns true if successful
 */
export function tryWritePortObject(handle, objData, overwrite = true) {
  if (!overwrite && !handle.empty()) {
    // Port contains data, preserve it
    return false;
  }

  if (typeof objData === 'object' && objData !== null) {
    handle.clear();
    return handle.tryWrite(JSON.stringify(objData));
  }
  return false;
}

/**
 * Adds a new or overwrites an existing key's value within a port's Object
 * @param {NetscriptPort} handle - Handle of the port to be updated
 * @param {String} key - The key whose value to add/overwrite
 * @param {any} data - The data to write to the key
 * @returns {boolean} Returns true if successful
 */
export function updatePortObjectKey(handle, key, data) {
  const objData = peekPortObject(handle);
  if (!handle.empty()) {
    if (objData) {
      objData[key] = data;
      return tryWritePortObject(handle, objData);
    }
  } else {
    // Port was empty, so create a new object with the data
    const newObjData = {};
    newObjData[key] = data;
    return tryWritePortObject(handle, newObjData);
  }
  return false;
}

/**
 * Deletes a key/value pair within a port's Object
 * @param {NetscriptPort} handle - Handle of the port to be updated
 * @param {String} key - The key to be deleted
 * @returns {boolean} Returns true if successful
 */
export function deletePortObjectKey(handle, key) {
  const objData = peekPortObject(handle);
  if (!handle.empty()) {
    if (objData) {
      delete objData[key];
      return tryWritePortObject(handle, objData);
    }
  }
  return false;
}
