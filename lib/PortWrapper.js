/* eslint-disable no-param-reassign */
export default class PortWrapper {
  // Private Properties
  #shared;

  #cachedData;

  // Private methods
  #detectDataType() {
    this.#updateCachedData();
    const type = typeof this.#cachedData;
    if (type === 'string' || type === 'number') {
      return type;
    }
    if (type === 'object' && this.#cachedData !== null) {
      return Array.isArray(this.#cachedData) ? 'array' : 'object';
    }
    return null;
  }

  #getDeepValue(obj, [prop, ...path]) {
    if (!path.length) {
      return obj[prop];
    }
    if (!(prop in obj)) obj[prop] = {};
    this.#getDeepValue(obj[prop], path);
    return null;
  }

  #setDeepValue(obj, [prop, ...path], value) {
    if (!path.length) {
      obj[prop] = value;
    } else {
      if (!(prop in obj)) obj[prop] = typeof prop === 'string' ? {} : [];
      this.#setDeepValue(obj[prop], path, value);
    }
  }

  #deleteDeepValue(obj, [prop, ...path]) {
    if (!path.length) {
      delete obj[prop];
    } else {
      if (!(prop in obj)) obj[prop] = {};
      this.#setDeepValue(obj[prop], path);
    }
  }

  #resetToDefault() {
    this.#shared.handle.clear();
    this.#cachedData = this.#shared.defaultValue;
  }

  #updateCachedData() {
    this.#cachedData = this.peek();
  }

  /** @param {NS} ns */
  constructor(ns, portNumber, defaultValue = {}) {
    this.#shared = {
      portNumber,
      handle: ns.getPortHandle(portNumber),
      initialized: Date.now(),
      lastRead: 0,
      lastWrite: 0,
      defaultValue,
    };
    this.#cachedData = this.#shared.handle.peek();
    if (this.#cachedData === 'NULL PORT DATA') {
      this.#resetToDefault();
    }
    this.#shared.dataType = this.#detectDataType();
  }

  get cachedData() {
    return this.#cachedData;
  }

  get dataType() {
    return this.#shared.dataType;
  }

  get defaultValue() {
    return this.#shared.defaultValue;
  }

  get empty() {
    return this.#shared.handle.empty();
  }

  get portNumber() {
    return this.#shared.portNumber;
  }

  get handle() {
    return this.#shared.handle;
  }

  get initialized() {
    return this.#shared.initialized;
  }

  get lastRead() {
    return this.#shared.lastRead;
  }

  get lastWrite() {
    return this.#shared.lastWrite;
  }

  /**
   * Destructively reads the data stored in the port
   * @returns {any} port data
   */
  read() {
    this.#shared.lastRead = Date.now();
    if (!this.empty) {
      this.#updateCachedData();
      return JSON.parse(this.#shared.handle.read());
    }
    this.#resetToDefault();
    return this.#cachedData;
  }

  /**
   * Non-desctructively peeks the data stored in the port
   * @returns {any} port data
   */
  peek() {
    this.#shared.lastRead = Date.now();
    if (!this.empty) {
      this.#cachedData = JSON.parse(this.#shared.handle.peek());
      return this.#cachedData;
    }
    this.#resetToDefault();
    return this.#cachedData;
  }

  /**
   * Erases all data in the port and sets it to its default value
   */
  clear() {
    this.#resetToDefault();
  }

  /**
   * Overwrites data in port with value given
   * @param {String | Number | Object} data Data to be written
   * @returns {Boolean} true if successful
   */
  write(data) {
    if (data || data === 0 || data === '') {
      let parsedData;
      this.#shared.handle.clear();
      if (typeof data === 'object') {
        parsedData = JSON.stringify(data);
      } else {
        parsedData = data;
      }
      if (this.#shared.handle.tryWrite(parsedData)) {
        this.#shared.lastWrite = Date.now();
        this.#updateCachedData();
        return true;
      }
    }
    return false;
  }

  /**
   * Non-destructively peeks a value in port data at the path given
   * @param {String | Array.<String | Number>} path - A property as a string or
   * path to a property as an array
   * @returns {any} value at given path within port data
   */
  peekValue(path) {
    this.#updateCachedData();
    if (!this.empty) {
      if (Array.isArray(path)) {
        return this.#getDeepValue(this.#cachedData, path);
      }
      return this.#cachedData[path];
    }
    return null;
  }

  /**
   * Writes a value into port data at the path given
   * @param {String | Array.<String | Number>} path - A property as a string or
   * path to a property as an array
   * @param {any} value
   * @returns {Boolean} true if successful
   */
  writeValue(path, value) {
    this.#updateCachedData();
    if (typeof this.#cachedData === 'object') {
      if (Array.isArray(path)) {
        this.#setDeepValue(this.#cachedData, path, value);
        return this.write(JSON.stringify(this.#cachedData));
      }
      this.#cachedData[path] = value;
      return this.write(JSON.stringify(this.#cachedData));
    }
    return false;
  }

  /**
   * Deletes the key/value pair or index in port data at the path given
   * @param {String | Array.<String | Number>} path - A property as a string or
   * path to a property as an array
   * @returns {Boolean} true if successful
   */
  deleteValue(path) {
    this.#updateCachedData();
    if (!this.empty) {
      if (Array.isArray(path)) {
        this.#deleteDeepValue(this.#cachedData, path);
        this.write(this.#cachedData);
        return true;
      }
      if (typeof path === 'string') {
        delete this.#cachedData[path];
        this.write(this.#cachedData);
        return true;
      }
    }
    return false;
  }
}
