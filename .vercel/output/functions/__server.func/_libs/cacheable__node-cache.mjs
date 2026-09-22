import { i as Hookified, n as Stats, r as shorthandToTime, t as CacheableMemory } from "./@cacheable/memory+[...].mjs";
//#region node_modules/@cacheable/node-cache/dist/index.js
var NodeCache = class extends Hookified {
	options = {
		stdTTL: 0,
		checkperiod: 600,
		useClones: true,
		deleteOnExpire: true,
		maxKeys: -1
	};
	store = /* @__PURE__ */ new Map();
	_stats = new Stats({ enabled: true });
	_cacheable = new CacheableMemory();
	intervalId = 0;
	constructor(options) {
		super();
		if (options) this.options = {
			...this.options,
			...options
		};
		this.startInterval();
	}
	/**
	* Sets a key value pair. It is possible to define a ttl (in seconds). Returns true on success.
	* @param {string | number} key - it will convert the key to a string
	* @param {T} value
	* @param {number | string} [ttl] - this is in seconds and undefined will use the default ttl
	* @returns {boolean}
	*/
	set(key, value, ttl = 0) {
		if (typeof key !== "string" && typeof key !== "number") throw this.createError("The key argument has to be of type `string` or `number`. Found: `__key`", key);
		if (ttl && typeof ttl !== "number" && typeof ttl !== "string") throw this.createError("The ttl argument has to be a number or a string for shorthand ttl.", this.formatKey(key));
		const keyValue = this.formatKey(key);
		let ttlValue = 0;
		if (this.options.stdTTL) ttlValue = this.getExpirationTimestamp(this.options.stdTTL);
		if (ttl) ttlValue = this.getExpirationTimestamp(ttl);
		let expirationTimestamp = 0;
		if (ttlValue && ttlValue > 0) expirationTimestamp = ttlValue;
		if (this.options.maxKeys) {
			const { maxKeys } = this.options;
			if (maxKeys > -1 && this.store.size >= maxKeys) throw this.createError("Cache max keys amount exceeded", this.formatKey(key));
		}
		this.store.set(keyValue, {
			key: keyValue,
			value,
			ttl: expirationTimestamp
		});
		this.emit("set", keyValue, value, ttlValue);
		this._stats.incrementKSize(keyValue);
		this._stats.incrementVSize(value);
		this._stats.setCount(this.store.size);
		return true;
	}
	/**
	* Sets multiple key val pairs. It is possible to define a ttl (seconds). Returns true on success.
	* @param {PartialNodeCacheItem<T>[]} data an array of key value pairs with optional ttl
	* @returns {boolean}
	*/
	mset(data) {
		if (!Array.isArray(data)) throw this.createError("The keys argument has to be an array.");
		for (const item of data) this.set(item.key, item.value, item.ttl);
		return true;
	}
	/**
	* Gets a saved value from the cache. Returns a undefined if not found or expired. If the value was found it returns the value.
	* @param {string | number} key if the key is a number it will convert it to a string
	* @returns {T} the value or undefined
	*/
	get(key) {
		const result = this.store.get(this.formatKey(key));
		if (result) {
			if (result.ttl > 0) {
				if (result.ttl < Date.now()) {
					if (this.options.deleteOnExpire) this.del(key);
					this._stats.incrementMisses();
					this.emit("expired", this.formatKey(key), result.value);
					return;
				}
				this._stats.incrementHits();
				if (this.options.useClones) return this._cacheable.clone(result.value);
				return result.value;
			}
			this._stats.incrementHits();
			if (this.options.useClones) return this._cacheable.clone(result.value);
			return result.value;
		}
		this._stats.incrementMisses();
	}
	/**
	* Gets multiple saved values from the cache. Returns an empty object {} if not found or expired.
	* If the value was found it returns an object with the key value pair.
	* @param {Array<string | number} keys an array of keys
	* @returns {Record<string, T | undefined>} an object with the key as a property and the value as the value
	*/
	mget(keys) {
		const result = {};
		for (const key of keys) {
			const value = this.get(key);
			if (value) result[this.formatKey(key)] = value;
		}
		return result;
	}
	/**
	* Get the cached value and remove the key from the cache. Equivalent to calling get(key) + del(key).
	* Useful for implementing single use mechanism such as OTP, where once a value is read it will become obsolete.
	* @param {string | number} key
	* @returns {T | undefined} the value or undefined
	*/
	take(key) {
		const result = this.get(key);
		if (result) {
			this.del(key);
			if (this.options.useClones) return this._cacheable.clone(result);
			return result;
		}
	}
	/**
	* Delete a key. Returns the number of deleted entries. A delete will never fail.
	* @param {string | number | Array<string | number>} key if the key is a number it will convert it to a string. if an array is passed it will delete all keys in the array.
	* @returns {number} if it was successful it will return the count that was deleted
	*/
	del(key) {
		if (Array.isArray(key)) return this.mdel(key);
		const result = this.store.get(this.formatKey(key));
		if (result) {
			const keyValue = this.formatKey(key);
			this.store.delete(keyValue);
			this.emit("del", keyValue, result.value);
			this._stats.decreaseKSize(keyValue);
			this._stats.decreaseVSize(result.value);
			this._stats.setCount(this.store.size);
			return 1;
		}
		return 0;
	}
	/**
	* Delete all keys in Array that exist. Returns the number of deleted entries.
	* @param {Array<string | number>} keys an array of keys
	* @returns {number} the count of deleted keys
	*/
	mdel(keys) {
		let result = 0;
		for (const key of keys) result += this.del(key);
		return result;
	}
	/**
	* Redefine the ttl of a key. Returns true if the key has been found and changed.
	* Otherwise returns false. If the ttl-argument isn't passed the default-TTL will be used.
	* @param {string | number} key if the key is a number it will convert it to a string
	* @param {number | string} [ttl] the ttl in seconds if number, or a shorthand string like '1h' for 1 hour
	* @returns {boolean} true if the key has been found and changed. Otherwise returns false.
	*/
	ttl(key, ttl) {
		const result = this.store.get(this.formatKey(key));
		if (result) {
			const ttlValue = ttl ?? this.options.stdTTL;
			result.ttl = this.getExpirationTimestamp(ttlValue);
			this.store.set(this.formatKey(key), result);
			return true;
		}
		return false;
	}
	/**
	* Receive the ttl of a key.
	* @param {string | number} key if the key is a number it will convert it to a string
	* @returns {number | undefined} 0 if this key has no ttl, undefined if this key is not in the cache,
	* a timestamp in ms representing the time at which this key will expire
	*/
	getTtl(key) {
		const result = this.store.get(this.formatKey(key));
		if (result) {
			if (result.ttl === 0) return 0;
			return result.ttl;
		}
	}
	/**
	* Returns an array of all existing keys. [ "all", "my", "keys", "foo", "bar" ]
	* @returns {string[]} an array of all keys
	*/
	keys() {
		const result = [];
		for (const key of this.store.keys()) result.push(key);
		return result;
	}
	/**
	* Returns boolean indicating if the key is cached.
	* @param {string | number} key if the key is a number it will convert it to a string
	* @returns {boolean} true if the key is cached
	*/
	has(key) {
		return this.store.has(this.formatKey(key));
	}
	/**
	* Gets the stats of the cache
	* @returns {NodeCacheStats} the stats of the cache
	*/
	getStats() {
		return {
			keys: this._stats.count,
			hits: this._stats.hits,
			misses: this._stats.misses,
			ksize: this._stats.ksize,
			vsize: this._stats.vsize
		};
	}
	/**
	* Flush the whole data.
	* @returns {void}
	*/
	flushAll() {
		this.store.clear();
		this.flushStats();
		this.emit("flush");
	}
	/**
	* Flush the stats.
	* @returns {void}
	*/
	flushStats() {
		this._stats = new Stats({ enabled: true });
		this.emit("flush_stats");
	}
	/**
	* Close the cache. This will clear the interval timeout which is set on check period option.
	* @returns {void}
	*/
	close() {
		this.stopInterval();
	}
	/**
	* Get the interval id
	* @returns {number | NodeJS.Timeout} the interval id
	*/
	getIntervalId() {
		return this.intervalId;
	}
	startInterval() {
		if (this.options.checkperiod && this.options.checkperiod > 0) {
			const checkPeriodinSeconds = this.options.checkperiod * 1e3;
			this.intervalId = setInterval(() => {
				this.checkData();
			}, checkPeriodinSeconds).unref();
			return;
		}
		this.intervalId = 0;
	}
	stopInterval() {
		if (this.intervalId !== 0) {
			clearInterval(this.intervalId);
			this.intervalId = 0;
		}
	}
	formatKey(key) {
		return key.toString();
	}
	getExpirationTimestamp(ttlInSeconds) {
		if (typeof ttlInSeconds === "string") return shorthandToTime(ttlInSeconds);
		return Date.now() + ttlInSeconds * 1e3;
	}
	checkData() {
		for (const [key, value] of this.store.entries()) if (value.ttl > 0 && value.ttl < Date.now()) {
			if (this.options.deleteOnExpire) this.del(key);
			this.emit("expired", this.formatKey(key), value.value);
		}
	}
	createError(errorCode, key) {
		let error = errorCode;
		if (key) error = error.replace("__key", key);
		return new Error(error);
	}
};
var index_default = NodeCache;
/* v8 ignore next -- @preserve */
//#endregion
export { index_default as t };
