//#region node_modules/hookified/dist/node/index.js
var Eventified = class {
	_eventListeners;
	_maxListeners;
	_logger;
	_throwOnEmitError = false;
	_throwOnEmptyListeners = false;
	_errorEvent = "error";
	constructor(options) {
		this._eventListeners = /* @__PURE__ */ new Map();
		this._maxListeners = 100;
		this._logger = options?.logger;
		if (options?.throwOnEmitError !== void 0) this._throwOnEmitError = options.throwOnEmitError;
		if (options?.throwOnEmptyListeners !== void 0) this._throwOnEmptyListeners = options.throwOnEmptyListeners;
	}
	/**
	* Gets the logger
	* @returns {Logger}
	*/
	get logger() {
		return this._logger;
	}
	/**
	* Sets the logger
	* @param {Logger} logger
	*/
	set logger(logger) {
		this._logger = logger;
	}
	/**
	* Gets whether an error should be thrown when an emit throws an error. Default is false and only emits an error event.
	* @returns {boolean}
	*/
	get throwOnEmitError() {
		return this._throwOnEmitError;
	}
	/**
	* Sets whether an error should be thrown when an emit throws an error. Default is false and only emits an error event.
	* @param {boolean} value
	*/
	set throwOnEmitError(value) {
		this._throwOnEmitError = value;
	}
	/**
	* Gets whether an error should be thrown when emitting 'error' event with no listeners. Default is false.
	* @returns {boolean}
	*/
	get throwOnEmptyListeners() {
		return this._throwOnEmptyListeners;
	}
	/**
	* Sets whether an error should be thrown when emitting 'error' event with no listeners. Default is false.
	* @param {boolean} value
	*/
	set throwOnEmptyListeners(value) {
		this._throwOnEmptyListeners = value;
	}
	/**
	* Adds a handler function for a specific event that will run only once
	* @param {string | symbol} eventName
	* @param {EventListener} listener
	* @returns {IEventEmitter} returns the instance of the class for chaining
	*/
	once(eventName, listener) {
		const onceListener = (...arguments_) => {
			this.off(eventName, onceListener);
			listener(...arguments_);
		};
		this.on(eventName, onceListener);
		return this;
	}
	/**
	* Gets the number of listeners for a specific event. If no event is provided, it returns the total number of listeners
	* @param {string} eventName The event name. Not required
	* @returns {number} The number of listeners
	*/
	listenerCount(eventName) {
		if (eventName === void 0) return this.getAllListeners().length;
		const listeners = this._eventListeners.get(eventName);
		return listeners ? listeners.length : 0;
	}
	/**
	* Gets an array of event names
	* @returns {Array<string | symbol>} An array of event names
	*/
	eventNames() {
		return [...this._eventListeners.keys()];
	}
	/**
	* Gets an array of listeners for a specific event. If no event is provided, it returns all listeners
	* @param {string} [event] (Optional) The event name
	* @returns {EventListener[]} An array of listeners
	*/
	rawListeners(event) {
		if (event === void 0) return this.getAllListeners();
		return this._eventListeners.get(event) ?? [];
	}
	/**
	* Prepends a listener to the beginning of the listeners array for the specified event
	* @param {string | symbol} eventName
	* @param {EventListener} listener
	* @returns {IEventEmitter} returns the instance of the class for chaining
	*/
	prependListener(eventName, listener) {
		const listeners = this._eventListeners.get(eventName) ?? [];
		listeners.unshift(listener);
		this._eventListeners.set(eventName, listeners);
		return this;
	}
	/**
	* Prepends a one-time listener to the beginning of the listeners array for the specified event
	* @param {string | symbol} eventName
	* @param {EventListener} listener
	* @returns {IEventEmitter} returns the instance of the class for chaining
	*/
	prependOnceListener(eventName, listener) {
		const onceListener = (...arguments_) => {
			this.off(eventName, onceListener);
			listener(...arguments_);
		};
		this.prependListener(eventName, onceListener);
		return this;
	}
	/**
	* Gets the maximum number of listeners that can be added for a single event
	* @returns {number} The maximum number of listeners
	*/
	maxListeners() {
		return this._maxListeners;
	}
	/**
	* Adds a listener for a specific event. It is an alias for the on() method
	* @param {string | symbol} event
	* @param {EventListener} listener
	* @returns {IEventEmitter} returns the instance of the class for chaining
	*/
	addListener(event, listener) {
		this.on(event, listener);
		return this;
	}
	/**
	* Adds a listener for a specific event
	* @param {string | symbol} event
	* @param {EventListener} listener
	* @returns {IEventEmitter} returns the instance of the class for chaining
	*/
	on(event, listener) {
		if (!this._eventListeners.has(event)) this._eventListeners.set(event, []);
		const listeners = this._eventListeners.get(event);
		if (listeners) {
			if (listeners.length >= this._maxListeners) console.warn(`MaxListenersExceededWarning: Possible event memory leak detected. ${listeners.length + 1} ${event} listeners added. Use setMaxListeners() to increase limit.`);
			listeners.push(listener);
		}
		return this;
	}
	/**
	* Removes a listener for a specific event. It is an alias for the off() method
	* @param {string | symbol} event
	* @param {EventListener} listener
	* @returns {IEventEmitter} returns the instance of the class for chaining
	*/
	removeListener(event, listener) {
		this.off(event, listener);
		return this;
	}
	/**
	* Removes a listener for a specific event
	* @param {string | symbol} event
	* @param {EventListener} listener
	* @returns {IEventEmitter} returns the instance of the class for chaining
	*/
	off(event, listener) {
		const listeners = this._eventListeners.get(event) ?? [];
		const index = listeners.indexOf(listener);
		if (index !== -1) listeners.splice(index, 1);
		if (listeners.length === 0) this._eventListeners.delete(event);
		return this;
	}
	/**
	* Calls all listeners for a specific event
	* @param {string | symbol} event
	* @param arguments_ The arguments to pass to the listeners
	* @returns {boolean} Returns true if the event had listeners, false otherwise
	*/
	emit(event, ...arguments_) {
		let result = false;
		const listeners = this._eventListeners.get(event);
		if (listeners && listeners.length > 0) for (const listener of listeners) {
			listener(...arguments_);
			result = true;
		}
		if (event === this._errorEvent) {
			const error = arguments_[0] instanceof Error ? arguments_[0] : /* @__PURE__ */ new Error(`${arguments_[0]}`);
			if (this._throwOnEmitError && !result) throw error;
			else if (this.listeners(this._errorEvent).length === 0 && this._throwOnEmptyListeners === true) throw error;
		}
		this.sendLog(event, arguments_);
		return result;
	}
	/**
	* Gets all listeners for a specific event. If no event is provided, it returns all listeners
	* @param {string} [event] (Optional) The event name
	* @returns {EventListener[]} An array of listeners
	*/
	listeners(event) {
		return this._eventListeners.get(event) ?? [];
	}
	/**
	* Removes all listeners for a specific event. If no event is provided, it removes all listeners
	* @param {string} [event] (Optional) The event name
	* @returns {IEventEmitter} returns the instance of the class for chaining
	*/
	removeAllListeners(event) {
		if (event !== void 0) this._eventListeners.delete(event);
		else this._eventListeners.clear();
		return this;
	}
	/**
	* Sets the maximum number of listeners that can be added for a single event
	* @param {number} n The maximum number of listeners
	* @returns {void}
	*/
	setMaxListeners(n) {
		this._maxListeners = n;
		for (const listeners of this._eventListeners.values()) if (listeners.length > n) listeners.splice(n);
	}
	/**
	* Gets all listeners
	* @returns {EventListener[]} An array of listeners
	*/
	getAllListeners() {
		let result = [];
		for (const listeners of this._eventListeners.values()) result = [...result, ...listeners];
		return result;
	}
	/**
	* Sends a log message using the configured logger based on the event name
	* @param {string | symbol} eventName - The event name that determines the log level
	* @param {unknown} data - The data to log
	*/
	sendLog(eventName, data) {
		if (!this._logger) return;
		let message;
		if (typeof data === "string") message = data;
		else if (Array.isArray(data) && data.length > 0 && data[0] instanceof Error) message = data[0].message;
		else if (data instanceof Error) message = data.message;
		else if (Array.isArray(data) && data.length > 0 && typeof data[0]?.message === "string") message = data[0].message;
		else message = JSON.stringify(data);
		switch (eventName) {
			case "error":
				this._logger.error?.(message, {
					event: eventName,
					data
				});
				break;
			case "warn":
				this._logger.warn?.(message, {
					event: eventName,
					data
				});
				break;
			case "trace":
				this._logger.trace?.(message, {
					event: eventName,
					data
				});
				break;
			case "debug":
				this._logger.debug?.(message, {
					event: eventName,
					data
				});
				break;
			case "fatal":
				this._logger.fatal?.(message, {
					event: eventName,
					data
				});
				break;
			default: this._logger.info?.(message, {
				event: eventName,
				data
			});
		}
	}
};
var Hookified = class extends Eventified {
	_hooks;
	_throwOnHookError = false;
	_enforceBeforeAfter = false;
	_deprecatedHooks;
	_allowDeprecated = true;
	constructor(options) {
		super({
			logger: options?.logger,
			throwOnEmitError: options?.throwOnEmitError,
			throwOnEmptyListeners: options?.throwOnEmptyListeners
		});
		this._hooks = /* @__PURE__ */ new Map();
		this._deprecatedHooks = options?.deprecatedHooks ? new Map(options.deprecatedHooks) : /* @__PURE__ */ new Map();
		if (options?.throwOnHookError !== void 0) this._throwOnHookError = options.throwOnHookError;
		else if (options?.throwHookErrors !== void 0) this._throwOnHookError = options.throwHookErrors;
		if (options?.enforceBeforeAfter !== void 0) this._enforceBeforeAfter = options.enforceBeforeAfter;
		if (options?.allowDeprecated !== void 0) this._allowDeprecated = options.allowDeprecated;
	}
	/**
	* Gets all hooks
	* @returns {Map<string, Hook[]>}
	*/
	get hooks() {
		return this._hooks;
	}
	/**
	* Gets whether an error should be thrown when a hook throws an error. Default is false and only emits an error event.
	* @returns {boolean}
	* @deprecated - this will be deprecated in version 2. Please use throwOnHookError.
	*/
	get throwHookErrors() {
		return this._throwOnHookError;
	}
	/**
	* Sets whether an error should be thrown when a hook throws an error. Default is false and only emits an error event.
	* @param {boolean} value
	* @deprecated - this will be deprecated in version 2. Please use throwOnHookError.
	*/
	set throwHookErrors(value) {
		this._throwOnHookError = value;
	}
	/**
	* Gets whether an error should be thrown when a hook throws an error. Default is false and only emits an error event.
	* @returns {boolean}
	*/
	get throwOnHookError() {
		return this._throwOnHookError;
	}
	/**
	* Sets whether an error should be thrown when a hook throws an error. Default is false and only emits an error event.
	* @param {boolean} value
	*/
	set throwOnHookError(value) {
		this._throwOnHookError = value;
	}
	/**
	* Gets whether to enforce that all hook names start with 'before' or 'after'. Default is false.
	* @returns {boolean}
	* @default false
	*/
	get enforceBeforeAfter() {
		return this._enforceBeforeAfter;
	}
	/**
	* Sets whether to enforce that all hook names start with 'before' or 'after'. Default is false.
	* @param {boolean} value
	*/
	set enforceBeforeAfter(value) {
		this._enforceBeforeAfter = value;
	}
	/**
	* Gets the map of deprecated hook names to deprecation messages.
	* @returns {Map<string, string>}
	*/
	get deprecatedHooks() {
		return this._deprecatedHooks;
	}
	/**
	* Sets the map of deprecated hook names to deprecation messages.
	* @param {Map<string, string>} value
	*/
	set deprecatedHooks(value) {
		this._deprecatedHooks = value;
	}
	/**
	* Gets whether deprecated hooks are allowed to be registered and executed. Default is true.
	* @returns {boolean}
	*/
	get allowDeprecated() {
		return this._allowDeprecated;
	}
	/**
	* Sets whether deprecated hooks are allowed to be registered and executed. Default is true.
	* @param {boolean} value
	*/
	set allowDeprecated(value) {
		this._allowDeprecated = value;
	}
	/**
	* Validates hook event name if enforceBeforeAfter is enabled
	* @param {string} event - The event name to validate
	* @throws {Error} If enforceBeforeAfter is true and event doesn't start with 'before' or 'after'
	*/
	validateHookName(event) {
		if (this._enforceBeforeAfter) {
			const eventValue = event.trim().toLocaleLowerCase();
			if (!eventValue.startsWith("before") && !eventValue.startsWith("after")) throw new Error(`Hook event "${event}" must start with "before" or "after" when enforceBeforeAfter is enabled`);
		}
	}
	/**
	* Checks if a hook is deprecated and emits a warning if it is
	* @param {string} event - The event name to check
	* @returns {boolean} - Returns true if the hook should proceed, false if it should be blocked
	*/
	checkDeprecatedHook(event) {
		if (this._deprecatedHooks.has(event)) {
			const message = this._deprecatedHooks.get(event);
			const warningMessage = `Hook "${event}" is deprecated${message ? `: ${message}` : ""}`;
			this.emit("warn", {
				hook: event,
				message: warningMessage
			});
			return this._allowDeprecated;
		}
		return true;
	}
	/**
	* Adds a handler function for a specific event
	* @param {string} event
	* @param {Hook} handler - this can be async or sync
	* @returns {void}
	*/
	onHook(event, handler) {
		this.onHookEntry({
			event,
			handler
		});
	}
	/**
	* Adds a handler function for a specific event
	* @param {HookEntry} hookEntry
	* @returns {void}
	*/
	onHookEntry(hookEntry) {
		this.validateHookName(hookEntry.event);
		if (!this.checkDeprecatedHook(hookEntry.event)) return;
		const eventHandlers = this._hooks.get(hookEntry.event);
		if (eventHandlers) eventHandlers.push(hookEntry.handler);
		else this._hooks.set(hookEntry.event, [hookEntry.handler]);
	}
	/**
	* Alias for onHook. This is provided for compatibility with other libraries that use the `addHook` method.
	* @param {string} event
	* @param {Hook} handler - this can be async or sync
	* @returns {void}
	*/
	addHook(event, handler) {
		this.onHookEntry({
			event,
			handler
		});
	}
	/**
	* Adds a handler function for a specific event
	* @param {Array<HookEntry>} hooks
	* @returns {void}
	*/
	onHooks(hooks) {
		for (const hook of hooks) this.onHook(hook.event, hook.handler);
	}
	/**
	* Adds a handler function for a specific event that runs before all other handlers
	* @param {string} event
	* @param {Hook} handler - this can be async or sync
	* @returns {void}
	*/
	prependHook(event, handler) {
		this.validateHookName(event);
		if (!this.checkDeprecatedHook(event)) return;
		const eventHandlers = this._hooks.get(event);
		if (eventHandlers) eventHandlers.unshift(handler);
		else this._hooks.set(event, [handler]);
	}
	/**
	* Adds a handler that only executes once for a specific event before all other handlers
	* @param event
	* @param handler
	*/
	prependOnceHook(event, handler) {
		this.validateHookName(event);
		if (!this.checkDeprecatedHook(event)) return;
		const hook = async (...arguments_) => {
			this.removeHook(event, hook);
			return handler(...arguments_);
		};
		this.prependHook(event, hook);
	}
	/**
	* Adds a handler that only executes once for a specific event
	* @param event
	* @param handler
	*/
	onceHook(event, handler) {
		this.validateHookName(event);
		if (!this.checkDeprecatedHook(event)) return;
		const hook = async (...arguments_) => {
			this.removeHook(event, hook);
			return handler(...arguments_);
		};
		this.onHook(event, hook);
	}
	/**
	* Removes a handler function for a specific event
	* @param {string} event
	* @param {Hook} handler
	* @returns {void}
	*/
	removeHook(event, handler) {
		this.validateHookName(event);
		if (!this.checkDeprecatedHook(event)) return;
		const eventHandlers = this._hooks.get(event);
		if (eventHandlers) {
			const index = eventHandlers.indexOf(handler);
			if (index !== -1) eventHandlers.splice(index, 1);
		}
	}
	/**
	* Removes all handlers for a specific event
	* @param {Array<HookEntry>} hooks
	* @returns {void}
	*/
	removeHooks(hooks) {
		for (const hook of hooks) this.removeHook(hook.event, hook.handler);
	}
	/**
	* Calls all handlers for a specific event
	* @param {string} event
	* @param {T[]} arguments_
	* @returns {Promise<void>}
	*/
	async hook(event, ...arguments_) {
		this.validateHookName(event);
		if (!this.checkDeprecatedHook(event)) return;
		const eventHandlers = this._hooks.get(event);
		if (eventHandlers) for (const handler of eventHandlers) try {
			await handler(...arguments_);
		} catch (error) {
			const message = `${event}: ${error.message}`;
			this.emit("error", new Error(message));
			if (this._throwOnHookError) throw new Error(message);
		}
	}
	/**
	* Calls all synchronous handlers for a specific event.
	* Async handlers (declared with `async` keyword) are silently skipped.
	*
	* Note: The `hook` method is preferred as it executes both sync and async functions.
	* Use `hookSync` only when you specifically need synchronous execution.
	* @param {string} event
	* @param {T[]} arguments_
	* @returns {void}
	*/
	hookSync(event, ...arguments_) {
		this.validateHookName(event);
		if (!this.checkDeprecatedHook(event)) return;
		const eventHandlers = this._hooks.get(event);
		if (eventHandlers) for (const handler of eventHandlers) {
			if (handler.constructor.name === "AsyncFunction") continue;
			try {
				handler(...arguments_);
			} catch (error) {
				const message = `${event}: ${error.message}`;
				this.emit("error", new Error(message));
				if (this._throwOnHookError) throw new Error(message);
			}
		}
	}
	/**
	* Prepends the word `before` to your hook. Example is event is `test`, the before hook is `before:test`.
	* @param {string} event - The event name
	* @param {T[]} arguments_ - The arguments to pass to the hook
	*/
	async beforeHook(event, ...arguments_) {
		await this.hook(`before:${event}`, ...arguments_);
	}
	/**
	* Prepends the word `after` to your hook. Example is event is `test`, the after hook is `after:test`.
	* @param {string} event - The event name
	* @param {T[]} arguments_ - The arguments to pass to the hook
	*/
	async afterHook(event, ...arguments_) {
		await this.hook(`after:${event}`, ...arguments_);
	}
	/**
	* Calls all handlers for a specific event. This is an alias for `hook` and is provided for
	* compatibility with other libraries that use the `callHook` method.
	* @param {string} event
	* @param {T[]} arguments_
	* @returns {Promise<void>}
	*/
	async callHook(event, ...arguments_) {
		await this.hook(event, ...arguments_);
	}
	/**
	* Gets all hooks for a specific event
	* @param {string} event
	* @returns {Hook[]}
	*/
	getHooks(event) {
		this.validateHookName(event);
		if (!this.checkDeprecatedHook(event)) return;
		return this._hooks.get(event);
	}
	/**
	* Removes all hooks
	* @returns {void}
	*/
	clearHooks() {
		this._hooks.clear();
	}
};
/* v8 ignore next -- @preserve */
//#endregion
//#region node_modules/hashery/dist/node/index.js
var Cache = class {
	_enabled = true;
	_maxSize = 4e3;
	_store = /* @__PURE__ */ new Map();
	_keys = [];
	constructor(options) {
		if (options?.enabled !== void 0) this._enabled = options.enabled;
		if (options?.maxSize !== void 0) this._maxSize = options.maxSize;
	}
	/**
	* Gets whether the cache is enabled.
	*/
	get enabled() {
		return this._enabled;
	}
	/**
	* Sets whether the cache is enabled.
	*/
	set enabled(value) {
		this._enabled = value;
	}
	/**
	* Gets the maximum number of items the cache can hold.
	*/
	get maxSize() {
		return this._maxSize;
	}
	/**
	* Sets the maximum number of items the cache can hold.
	*/
	set maxSize(value) {
		this._maxSize = value;
	}
	/**
	* Gets the underlying Map store.
	*/
	get store() {
		return this._store;
	}
	/**
	* Gets the current number of items in the cache.
	*/
	get size() {
		return this._store.size;
	}
	/**
	* Gets a value from the cache.
	* @param key - The cache key
	* @returns The cached value, or undefined if not found
	*/
	get(key) {
		return this._store.get(key);
	}
	/**
	* Sets a value in the cache with FIFO eviction.
	* If the cache is disabled, this method does nothing.
	* If the cache is at capacity, the oldest entry is removed before adding the new one.
	* @param key - The cache key
	* @param value - The value to cache
	*/
	set(key, value) {
		if (!this._enabled) return;
		if (this._store.has(key)) {
			this._store.set(key, value);
			return;
		}
		if (this._store.size >= this._maxSize) {
			const oldestKey = this._keys.shift();
			if (oldestKey) this._store.delete(oldestKey);
		}
		this._keys.push(key);
		this._store.set(key, value);
	}
	/**
	* Checks if a key exists in the cache.
	* @param key - The cache key
	* @returns True if the key exists, false otherwise
	*/
	has(key) {
		return this._store.has(key);
	}
	/**
	* Clears all entries from the cache.
	*/
	clear() {
		this._store.clear();
		this._keys = [];
	}
};
var CRC = class {
	get name() {
		return "crc32";
	}
	toHashSync(data) {
		let bytes;
		if (data instanceof Uint8Array) bytes = data;
		else if (data instanceof ArrayBuffer) bytes = new Uint8Array(data);
		else if (data instanceof DataView) bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
		else {
			const view = data;
			bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
		}
		const CRC32_POLYNOMIAL = 3988292384;
		let crc = 4294967295;
		for (let i = 0; i < bytes.length; i++) {
			crc = crc ^ bytes[i];
			for (let j = 0; j < 8; j++) crc = crc >>> 1 ^ CRC32_POLYNOMIAL & -(crc & 1);
		}
		crc = (crc ^ 4294967295) >>> 0;
		return crc.toString(16).padStart(8, "0");
	}
	async toHash(data) {
		return this.toHashSync(data);
	}
};
var WebCrypto = class {
	_algorithm = "SHA-256";
	constructor(options) {
		if (options?.algorithm) this._algorithm = options?.algorithm;
	}
	get name() {
		return this._algorithm;
	}
	async toHash(data) {
		const hashBuffer = await crypto.subtle.digest(this._algorithm, data);
		return Array.from(new Uint8Array(hashBuffer)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
	}
};
var DJB2 = class {
	/**
	* The name identifier for this hash provider.
	*/
	get name() {
		return "djb2";
	}
	/**
	* Computes the DJB2 hash of the provided data synchronously.
	*
	* @param data - The data to hash (Uint8Array, ArrayBuffer, or DataView)
	* @returns An 8-character lowercase hexadecimal string
	*
	* @example
	* ```typescript
	* const djb2 = new DJB2();
	* const data = new TextEncoder().encode('hello');
	* const hash = djb2.toHashSync(data);
	* console.log(hash); // "7c9df5ea"
	* ```
	*/
	toHashSync(data) {
		let bytes;
		if (data instanceof Uint8Array) bytes = data;
		else if (data instanceof ArrayBuffer) bytes = new Uint8Array(data);
		else if (data instanceof DataView) bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
		else {
			const view = data;
			bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
		}
		let hash = 5381;
		for (let i = 0; i < bytes.length; i++) {
			hash = (hash << 5) + hash + bytes[i];
			hash = hash >>> 0;
		}
		return hash.toString(16).padStart(8, "0");
	}
	/**
	* Computes the DJB2 hash of the provided data.
	*
	* @param data - The data to hash (Uint8Array, ArrayBuffer, or DataView)
	* @returns A Promise resolving to an 8-character lowercase hexadecimal string
	*
	* @example
	* ```typescript
	* const djb2 = new DJB2();
	* const data = new TextEncoder().encode('hello');
	* const hash = await djb2.toHash(data);
	* console.log(hash); // "7c9df5ea"
	* ```
	*/
	async toHash(data) {
		return this.toHashSync(data);
	}
};
var FNV1 = class {
	/**
	* The name identifier for this hash provider.
	*/
	get name() {
		return "fnv1";
	}
	/**
	* Computes the FNV-1 hash of the provided data synchronously.
	*
	* @param data - The data to hash (Uint8Array, ArrayBuffer, or DataView)
	* @returns An 8-character lowercase hexadecimal string
	*/
	toHashSync(data) {
		let bytes;
		if (data instanceof Uint8Array) bytes = data;
		else if (data instanceof ArrayBuffer) bytes = new Uint8Array(data);
		else if (data instanceof DataView) bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
		else {
			const view = data;
			bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
		}
		const FNV_OFFSET_BASIS = 2166136261;
		const FNV_PRIME = 16777619;
		let hash = FNV_OFFSET_BASIS;
		for (let i = 0; i < bytes.length; i++) {
			hash = hash * FNV_PRIME;
			hash = hash ^ bytes[i];
			hash = hash >>> 0;
		}
		return hash.toString(16).padStart(8, "0");
	}
	/**
	* Computes the FNV-1 hash of the provided data.
	*
	* @param data - The data to hash (Uint8Array, ArrayBuffer, or DataView)
	* @returns A Promise resolving to an 8-character lowercase hexadecimal string
	*/
	async toHash(data) {
		return this.toHashSync(data);
	}
};
var Murmur = class {
	_seed;
	/**
	* Creates a new Murmur instance.
	*
	* @param seed - Optional seed value for the hash (default: 0)
	*/
	constructor(seed = 0) {
		this._seed = seed >>> 0;
	}
	/**
	* The name identifier for this hash provider.
	*/
	get name() {
		return "murmur";
	}
	/**
	* Gets the current seed value used for hashing.
	*/
	get seed() {
		return this._seed;
	}
	/**
	* Computes the Murmur 32-bit hash of the provided data synchronously.
	*
	* @param data - The data to hash (Uint8Array, ArrayBuffer, or DataView)
	* @returns An 8-character lowercase hexadecimal string
	*
	* @example
	* ```typescript
	* const murmur = new Murmur();
	* const data = new TextEncoder().encode('hello');
	* const hash = murmur.toHashSync(data);
	* console.log(hash); // "248bfa47"
	* ```
	*/
	toHashSync(data) {
		let bytes;
		if (data instanceof Uint8Array) bytes = data;
		else if (data instanceof ArrayBuffer) bytes = new Uint8Array(data);
		else if (data instanceof DataView) bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
		else {
			const view = data;
			bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
		}
		const c1 = 3432918353;
		const c2 = 461845907;
		const length = bytes.length;
		const nblocks = Math.floor(length / 4);
		let h1 = this._seed;
		for (let i = 0; i < nblocks; i++) {
			const index = i * 4;
			let k12 = bytes[index] & 255 | (bytes[index + 1] & 255) << 8 | (bytes[index + 2] & 255) << 16 | (bytes[index + 3] & 255) << 24;
			k12 = this._imul(k12, c1);
			k12 = this._rotl32(k12, 15);
			k12 = this._imul(k12, c2);
			h1 ^= k12;
			h1 = this._rotl32(h1, 13);
			h1 = this._imul(h1, 5) + 3864292196;
		}
		const tail = nblocks * 4;
		let k1 = 0;
		switch (length & 3) {
			case 3: k1 ^= (bytes[tail + 2] & 255) << 16;
			case 2: k1 ^= (bytes[tail + 1] & 255) << 8;
			case 1:
				k1 ^= bytes[tail] & 255;
				k1 = this._imul(k1, c1);
				k1 = this._rotl32(k1, 15);
				k1 = this._imul(k1, c2);
				h1 ^= k1;
		}
		h1 ^= length;
		h1 ^= h1 >>> 16;
		h1 = this._imul(h1, 2246822507);
		h1 ^= h1 >>> 13;
		h1 = this._imul(h1, 3266489909);
		h1 ^= h1 >>> 16;
		h1 = h1 >>> 0;
		return h1.toString(16).padStart(8, "0");
	}
	/**
	* Computes the Murmur 32-bit hash of the provided data.
	*
	* @param data - The data to hash (Uint8Array, ArrayBuffer, or DataView)
	* @returns A Promise resolving to an 8-character lowercase hexadecimal string
	*
	* @example
	* ```typescript
	* const murmur = new Murmur();
	* const data = new TextEncoder().encode('hello');
	* const hash = await murmur.toHash(data);
	* console.log(hash); // "248bfa47"
	* ```
	*/
	async toHash(data) {
		return this.toHashSync(data);
	}
	/**
	* 32-bit integer multiplication with proper overflow handling.
	* @private
	*/
	_imul(a, b) {
		if (Math.imul) return Math.imul(a, b);
		const ah = a >>> 16 & 65535;
		const al = a & 65535;
		const bh = b >>> 16 & 65535;
		const bl = b & 65535;
		return al * bl + (ah * bl + al * bh << 16 >>> 0) | 0;
	}
	/**
	* Left rotate a 32-bit integer.
	* @private
	*/
	_rotl32(x, r) {
		return x << r | x >>> 32 - r;
	}
};
var HashProviders = class {
	_providers = /* @__PURE__ */ new Map();
	_getFuzzy = true;
	/**
	* Creates a new HashProviders instance.
	* @param options - Optional configuration including initial providers to load
	* @example
	* ```ts
	* const providers = new HashProviders({
	*   providers: [{ name: 'custom', toHash: async (data) => '...' }]
	* });
	* ```
	*/
	constructor(options) {
		if (options?.providers) this.loadProviders(options?.providers);
		if (options?.getFuzzy !== void 0) this._getFuzzy = Boolean(options?.getFuzzy);
	}
	/**
	* Loads multiple hash providers at once.
	* Each provider is added to the internal map using its name as the key.
	* @param providers - Array of HashProvider objects to load
	* @example
	* ```ts
	* const providers = new HashProviders();
	* providers.loadProviders([
	*   { name: 'md5', toHash: async (data) => '...' },
	*   { name: 'sha1', toHash: async (data) => '...' }
	* ]);
	* ```
	*/
	loadProviders(providers) {
		for (const provider of providers) this._providers.set(provider.name, provider);
	}
	/**
	* Gets the internal Map of all registered hash providers.
	* @returns Map of provider names to HashProvider objects
	*/
	get providers() {
		return this._providers;
	}
	/**
	* Sets the internal Map of hash providers, replacing all existing providers.
	* @param providers - Map of provider names to HashProvider objects
	*/
	set providers(providers) {
		this._providers = providers;
	}
	/**
	* Gets an array of all provider names.
	* @returns Array of provider names
	* @example
	* ```ts
	* const providers = new HashProviders();
	* providers.add({ name: 'sha256', toHash: async (data) => '...' });
	* providers.add({ name: 'md5', toHash: async (data) => '...' });
	* console.log(providers.names); // ['sha256', 'md5']
	* ```
	*/
	get names() {
		return Array.from(this._providers.keys());
	}
	/**
	* Gets a hash provider by name with optional fuzzy matching.
	*
	* Fuzzy matching (enabled by default) attempts to find providers by:
	* 1. Exact match (after trimming whitespace)
	* 2. Case-insensitive match (lowercase)
	* 3. Dash-removed match (e.g., "SHA-256" matches "sha256")
	*
	* @param name - The name of the provider to retrieve
	* @param options - Optional configuration for the get operation
	* @param options.fuzzy - Enable/disable fuzzy matching (overrides constructor setting)
	* @returns The HashProvider if found, undefined otherwise
	* @example
	* ```ts
	* const providers = new HashProviders();
	* providers.add({ name: 'sha256', toHash: async (data) => '...' });
	*
	* // Exact match
	* const provider = providers.get('sha256');
	*
	* // Fuzzy match (case-insensitive)
	* const provider2 = providers.get('SHA256');
	*
	* // Fuzzy match (with dash)
	* const provider3 = providers.get('SHA-256');
	*
	* // Disable fuzzy matching
	* const provider4 = providers.get('SHA256', { fuzzy: false }); // returns undefined
	* ```
	*/
	get(name, options) {
		const getFuzzy = options?.fuzzy ?? this._getFuzzy;
		name = name.trim();
		let result = this._providers.get(name);
		if (result === void 0 && getFuzzy === true) {
			name = name.toLowerCase();
			result = this._providers.get(name);
		}
		if (result === void 0 && getFuzzy === true) {
			name = name.replaceAll("-", "");
			result = this._providers.get(name);
		}
		return result;
	}
	/**
	* Adds a single hash provider to the collection.
	* If a provider with the same name already exists, it will be replaced.
	* @param provider - The HashProvider object to add
	* @example
	* ```ts
	* const providers = new HashProviders();
	* providers.add({
	*   name: 'custom-hash',
	*   toHash: async (data) => {
	*     // Custom hashing logic
	*     return 'hash-result';
	*   }
	* });
	* ```
	*/
	add(provider) {
		this._providers.set(provider.name, provider);
	}
	/**
	* Removes a hash provider from the collection by name.
	* @param name - The name of the provider to remove
	* @returns true if the provider was found and removed, false otherwise
	* @example
	* ```ts
	* const providers = new HashProviders();
	* providers.add({ name: 'custom', toHash: async (data) => '...' });
	* const removed = providers.remove('custom'); // returns true
	* const removed2 = providers.remove('nonexistent'); // returns false
	* ```
	*/
	remove(name) {
		return this._providers.delete(name);
	}
};
var Hashery = class extends Hookified {
	_parse = JSON.parse;
	_stringify = JSON.stringify;
	_providers = new HashProviders();
	_defaultAlgorithm = "SHA-256";
	_defaultAlgorithmSync = "djb2";
	_cache;
	constructor(options) {
		super(options);
		if (options?.parse) this._parse = options.parse;
		if (options?.stringify) this._stringify = options.stringify;
		if (options?.defaultAlgorithm) this._defaultAlgorithm = options.defaultAlgorithm;
		if (options?.defaultAlgorithmSync) this._defaultAlgorithmSync = options.defaultAlgorithmSync;
		this._cache = new Cache(options?.cache);
		this.loadProviders(options?.providers, { includeBase: options?.includeBase ?? true });
	}
	/**
	* Gets the parse function used to deserialize stored values.
	* @returns The current parse function (defaults to JSON.parse)
	*/
	get parse() {
		return this._parse;
	}
	/**
	* Sets the parse function used to deserialize stored values.
	* @param value - The parse function to use for deserialization
	*/
	set parse(value) {
		this._parse = value;
	}
	/**
	* Gets the stringify function used to serialize values for storage.
	* @returns The current stringify function (defaults to JSON.stringify)
	*/
	get stringify() {
		return this._stringify;
	}
	/**
	* Sets the stringify function used to serialize values for storage.
	* @param value - The stringify function to use for serialization
	*/
	set stringify(value) {
		this._stringify = value;
	}
	/**
	* Gets the HashProviders instance used to manage hash providers.
	* @returns The current HashProviders instance
	*/
	get providers() {
		return this._providers;
	}
	/**
	* Sets the HashProviders instance used to manage hash providers.
	* @param value - The HashProviders instance to use
	*/
	set providers(value) {
		this._providers = value;
	}
	/**
	* Gets the names of all registered hash algorithm providers.
	* @returns An array of provider names (e.g., ['SHA-256', 'SHA-384', 'SHA-512'])
	*/
	get names() {
		return this._providers.names;
	}
	/**
	* Gets the default hash algorithm used when none is specified.
	* @returns The current default algorithm (defaults to 'SHA-256')
	*/
	get defaultAlgorithm() {
		return this._defaultAlgorithm;
	}
	/**
	* Sets the default hash algorithm to use when none is specified.
	* @param value - The default algorithm to use (e.g., 'SHA-256', 'SHA-512', 'djb2')
	* @example
	* ```ts
	* const hashery = new Hashery();
	* hashery.defaultAlgorithm = 'SHA-512';
	*
	* // Now toHash will use SHA-512 by default
	* const hash = await hashery.toHash({ data: 'example' });
	* ```
	*/
	set defaultAlgorithm(value) {
		this._defaultAlgorithm = value;
	}
	/**
	* Gets the default synchronous hash algorithm used when none is specified.
	* @returns The current default synchronous algorithm (defaults to 'djb2')
	*/
	get defaultAlgorithmSync() {
		return this._defaultAlgorithmSync;
	}
	/**
	* Sets the default synchronous hash algorithm to use when none is specified.
	* @param value - The default synchronous algorithm to use (e.g., 'djb2', 'fnv1', 'murmur', 'crc32')
	* @example
	* ```ts
	* const hashery = new Hashery();
	* hashery.defaultAlgorithmSync = 'fnv1';
	*
	* // Now synchronous operations will use fnv1 by default
	* ```
	*/
	set defaultAlgorithmSync(value) {
		this._defaultAlgorithmSync = value;
	}
	/**
	* Gets the cache instance used to store computed hash values.
	* @returns The Cache instance
	* @example
	* ```ts
	* const hashery = new Hashery({ cache: { enabled: true } });
	*
	* // Access the cache
	* hashery.cache.enabled; // true
	* hashery.cache.size; // number of cached items
	* hashery.cache.clear(); // clear all cached items
	* ```
	*/
	get cache() {
		return this._cache;
	}
	/**
	* Generates a cryptographic hash of the provided data using the Web Crypto API.
	* The data is first stringified using the configured stringify function, then hashed.
	*
	* If an invalid algorithm is provided, a 'warn' event is emitted and the method falls back
	* to the default algorithm. You can listen to these warnings:
	* ```ts
	* hashery.on('warn', (message) => console.log(message));
	* ```
	*
	* @param data - The data to hash (will be stringified before hashing)
	* @param options - Optional configuration object
	* @param options.algorithm - The hash algorithm to use (defaults to 'SHA-256')
	* @param options.maxLength - Optional maximum length for the hash output
	* @returns A Promise that resolves to the hexadecimal string representation of the hash
	*
	* @example
	* ```ts
	* const hashery = new Hashery();
	* const hash = await hashery.toHash({ name: 'John', age: 30 });
	* console.log(hash); // "a1b2c3d4..."
	*
	* // Using a different algorithm
	* const hash512 = await hashery.toHash({ name: 'John' }, { algorithm: 'SHA-512' });
	* ```
	*/
	async toHash(data, options) {
		const context = {
			data,
			algorithm: options?.algorithm ?? this._defaultAlgorithm,
			maxLength: options?.maxLength
		};
		await this.beforeHook("toHash", context);
		const stringified = this._stringify(context.data);
		const cacheKey = `${context.algorithm}:${stringified}`;
		if (this._cache.enabled) {
			const cached = this._cache.get(cacheKey);
			if (cached !== void 0) {
				let cachedHash = cached;
				if (options?.maxLength && cachedHash.length > options.maxLength) cachedHash = cachedHash.substring(0, options.maxLength);
				const result2 = {
					hash: cachedHash,
					data: context.data,
					algorithm: context.algorithm
				};
				await this.afterHook("toHash", result2);
				return result2.hash;
			}
		}
		const dataBuffer = new TextEncoder().encode(stringified);
		let provider = this._providers.get(context.algorithm);
		if (!provider) {
			this.emit("warn", `Invalid algorithm '${context.algorithm}' not found. Falling back to default algorithm '${this._defaultAlgorithm}'.`);
			provider = new WebCrypto({ algorithm: this._defaultAlgorithm });
		}
		let hash = await provider.toHash(dataBuffer);
		if (this._cache.enabled) this._cache.set(cacheKey, hash);
		if (options?.maxLength && hash.length > options?.maxLength) hash = hash.substring(0, options.maxLength);
		const result = {
			hash,
			data: context.data,
			algorithm: context.algorithm
		};
		await this.afterHook("toHash", result);
		return result.hash;
	}
	/**
	* Generates a deterministic number within a specified range based on the hash of the provided data.
	* This method uses the toHash function to create a consistent hash, then maps it to a number
	* between min and max (inclusive).
	*
	* @param data - The data to hash (will be stringified before hashing)
	* @param options - Configuration options (optional, defaults to min: 0, max: 100)
	* @param options.min - The minimum value of the range (inclusive, defaults to 0)
	* @param options.max - The maximum value of the range (inclusive, defaults to 100)
	* @param options.algorithm - The hash algorithm to use (defaults to 'SHA-256')
	* @param options.hashLength - Number of characters from hash to use for conversion (defaults to 16)
	* @returns A Promise that resolves to a number between min and max (inclusive)
	*
	* @example
	* ```ts
	* const hashery = new Hashery();
	* const num = await hashery.toNumber({ user: 'john' }); // Uses default min: 0, max: 100
	* console.log(num); // Always returns the same number for the same input, e.g., 42
	*
	* // Using custom range
	* const num2 = await hashery.toNumber({ user: 'john' }, { min: 1, max: 100 });
	*
	* // Using a different algorithm
	* const num512 = await hashery.toNumber({ user: 'john' }, { min: 0, max: 255, algorithm: 'SHA-512' });
	* ```
	*/
	async toNumber(data, options = {}) {
		const { min = 0, max = 100, algorithm = this._defaultAlgorithm, hashLength = 16 } = options;
		if (min > max) throw new Error("min cannot be greater than max");
		const hash = await this.toHash(data, {
			algorithm,
			maxLength: hashLength
		});
		return min + Number.parseInt(hash, 16) % (max - min + 1);
	}
	/**
	* Generates a hash of the provided data synchronously using a non-cryptographic hash algorithm.
	* The data is first stringified using the configured stringify function, then hashed.
	*
	* Note: This method only works with synchronous hash providers (djb2, fnv1, murmur, crc32).
	* WebCrypto algorithms (SHA-256, SHA-384, SHA-512) are not supported and will throw an error.
	*
	* If an invalid algorithm is provided, a 'warn' event is emitted and the method falls back
	* to the default synchronous algorithm. You can listen to these warnings:
	* ```ts
	* hashery.on('warn', (message) => console.log(message));
	* ```
	*
	* @param data - The data to hash (will be stringified before hashing)
	* @param options - Optional configuration object
	* @param options.algorithm - The hash algorithm to use (defaults to 'djb2')
	* @param options.maxLength - Optional maximum length for the hash output
	* @returns The hexadecimal string representation of the hash
	*
	* @throws {Error} If the specified algorithm does not support synchronous hashing
	* @throws {Error} If the default algorithm is not found
	*
	* @example
	* ```ts
	* const hashery = new Hashery();
	* const hash = hashery.toHashSync({ name: 'John', age: 30 });
	* console.log(hash); // "7c9df5ea..." (djb2 hash)
	*
	* // Using a different algorithm
	* const hashFnv1 = hashery.toHashSync({ name: 'John' }, { algorithm: 'fnv1' });
	* ```
	*/
	toHashSync(data, options) {
		const context = {
			data,
			algorithm: options?.algorithm ?? this._defaultAlgorithmSync,
			maxLength: options?.maxLength
		};
		this.hookSync("before:toHashSync", context);
		const algorithm = context.algorithm;
		const stringified = this._stringify(context.data);
		const cacheKey = `${algorithm}:${stringified}`;
		if (this._cache.enabled) {
			const cached = this._cache.get(cacheKey);
			if (cached !== void 0) {
				let cachedHash = cached;
				if (options?.maxLength && cachedHash.length > options.maxLength) cachedHash = cachedHash.substring(0, options.maxLength);
				const result2 = {
					hash: cachedHash,
					data: context.data,
					algorithm
				};
				this.hookSync("after:toHashSync", result2);
				return result2.hash;
			}
		}
		const dataBuffer = new TextEncoder().encode(stringified);
		let provider = this._providers.get(algorithm);
		if (!provider) {
			this.emit("warn", `Invalid algorithm '${algorithm}' not found. Falling back to default algorithm '${this._defaultAlgorithmSync}'.`);
			provider = this._providers.get(this._defaultAlgorithmSync);
			if (!provider) throw new Error(`Hash provider '${this._defaultAlgorithmSync}' (default) not found`);
		}
		if (!provider.toHashSync) throw new Error(`Hash provider '${algorithm}' does not support synchronous hashing. Use toHash() instead or choose a different algorithm (djb2, fnv1, murmur, crc32).`);
		let hash = provider.toHashSync(dataBuffer);
		if (this._cache.enabled) this._cache.set(cacheKey, hash);
		if (options?.maxLength && hash.length > options?.maxLength) hash = hash.substring(0, options.maxLength);
		const result = {
			hash,
			data: context.data,
			algorithm: context.algorithm
		};
		this.hookSync("after:toHashSync", result);
		return result.hash;
	}
	/**
	* Generates a deterministic number within a specified range based on the hash of the provided data synchronously.
	* This method uses the toHashSync function to create a consistent hash, then maps it to a number
	* between min and max (inclusive).
	*
	* Note: This method only works with synchronous hash providers (djb2, fnv1, murmur, crc32).
	*
	* @param data - The data to hash (will be stringified before hashing)
	* @param options - Configuration options (optional, defaults to min: 0, max: 100)
	* @param options.min - The minimum value of the range (inclusive, defaults to 0)
	* @param options.max - The maximum value of the range (inclusive, defaults to 100)
	* @param options.algorithm - The hash algorithm to use (defaults to 'djb2')
	* @param options.hashLength - Number of characters from hash to use for conversion (defaults to 16)
	* @returns A number between min and max (inclusive)
	*
	* @throws {Error} If the specified algorithm does not support synchronous hashing
	* @throws {Error} If min is greater than max
	*
	* @example
	* ```ts
	* const hashery = new Hashery();
	* const num = hashery.toNumberSync({ user: 'john' }); // Uses default min: 0, max: 100
	* console.log(num); // Always returns the same number for the same input, e.g., 42
	*
	* // Using custom range
	* const num2 = hashery.toNumberSync({ user: 'john' }, { min: 1, max: 100 });
	*
	* // Using a different algorithm
	* const numFnv1 = hashery.toNumberSync({ user: 'john' }, { min: 0, max: 255, algorithm: 'fnv1' });
	* ```
	*/
	toNumberSync(data, options = {}) {
		const { min = 0, max = 100, algorithm = this._defaultAlgorithmSync, hashLength = 16 } = options;
		if (min > max) throw new Error("min cannot be greater than max");
		const hash = this.toHashSync(data, {
			algorithm,
			maxLength: hashLength
		});
		return min + Number.parseInt(hash, 16) % (max - min + 1);
	}
	loadProviders(providers, options = { includeBase: true }) {
		if (providers) for (const provider of providers) this._providers.add(provider);
		if (options.includeBase) {
			this.providers.add(new WebCrypto({ algorithm: "SHA-256" }));
			this.providers.add(new WebCrypto({ algorithm: "SHA-384" }));
			this.providers.add(new WebCrypto({ algorithm: "SHA-512" }));
			this.providers.add(new CRC());
			this.providers.add(new DJB2());
			this.providers.add(new FNV1());
			this.providers.add(new Murmur());
		}
	}
};
/* v8 ignore next -- @preserve */
//#endregion
//#region node_modules/@cacheable/utils/dist/index.mjs
/**
* Converts a shorthand time string or number into milliseconds.
* The shorthand can be a string like '1s', '2m', '3h', '4d', or a number representing milliseconds.
* If the input is undefined, it returns undefined.
* If the input is a string that does not match the expected format, it throws an error.
* @param shorthand - A shorthand time string or number representing milliseconds.
* @returns The equivalent time in milliseconds or undefined.
*/
var shorthandToMilliseconds = (shorthand) => {
	let milliseconds;
	if (shorthand === void 0) return;
	if (typeof shorthand === "number") milliseconds = shorthand;
	else {
		if (typeof shorthand !== "string") return;
		shorthand = shorthand.trim();
		if (Number.isNaN(Number(shorthand))) {
			const match = /^([\d.]+)\s*(ms|s|m|h|hr|d)$/i.exec(shorthand);
			if (!match) throw new Error(`Unsupported time format: "${shorthand}". Use 'ms', 's', 'm', 'h', 'hr', or 'd'.`);
			const [, value, unit] = match;
			const numericValue = Number.parseFloat(value);
			switch (unit.toLowerCase()) {
				case "ms":
					milliseconds = numericValue;
					break;
				case "s":
					milliseconds = numericValue * 1e3;
					break;
				case "m":
					milliseconds = numericValue * 1e3 * 60;
					break;
				case "h":
					milliseconds = numericValue * 1e3 * 60 * 60;
					break;
				case "hr":
					milliseconds = numericValue * 1e3 * 60 * 60;
					break;
				case "d":
					milliseconds = numericValue * 1e3 * 60 * 60 * 24;
					break;
				/* v8 ignore next -- @preserve */
				default: milliseconds = Number(shorthand);
			}
		} else milliseconds = Number(shorthand);
	}
	return milliseconds;
};
/**
* Converts a shorthand time string or number into a timestamp.
* If the shorthand is undefined, it returns the current date's timestamp.
* If the shorthand is a valid time format, it adds that duration to the current date's timestamp.
* @param shorthand - A shorthand time string or number representing milliseconds.
* @param fromDate - An optional Date object to calculate from. Defaults to the current date if not provided.
* @returns The timestamp in milliseconds since epoch.
*/
var shorthandToTime = (shorthand, fromDate) => {
	fromDate ??= /* @__PURE__ */ new Date();
	const milliseconds = shorthandToMilliseconds(shorthand);
	if (milliseconds === void 0) return fromDate.getTime();
	return fromDate.getTime() + milliseconds;
};
var HashAlgorithm = /* @__PURE__ */ function(HashAlgorithm) {
	HashAlgorithm["SHA256"] = "SHA-256";
	HashAlgorithm["SHA384"] = "SHA-384";
	HashAlgorithm["SHA512"] = "SHA-512";
	HashAlgorithm["DJB2"] = "djb2";
	HashAlgorithm["FNV1"] = "fnv1";
	HashAlgorithm["MURMER"] = "murmer";
	HashAlgorithm["CRC32"] = "crc32";
	return HashAlgorithm;
}({});
/**
* Hashes an object synchronously using the specified non-cryptographic algorithm.
* This method should be used for non-cryptographic algorithms (DJB2, FNV1, MURMER, CRC32).
* For cryptographic algorithms, use hash() instead.
* @param object The object to hash
* @param options The hash options to use
* @returns {string} The hash of the object
*/
function hashSync(object, options = {
	algorithm: "djb2",
	serialize: JSON.stringify
}) {
	const algorithm = options?.algorithm ?? "djb2";
	const objectString = (options?.serialize ?? JSON.stringify)(object);
	return new Hashery().toHashSync(objectString, { algorithm });
}
/**
* Hashes an object synchronously and converts it to a number within a specified range.
* This method should be used for non-cryptographic algorithms (DJB2, FNV1, MURMER, CRC32).
* For cryptographic algorithms, use hashToNumber() instead.
* @param object The object to hash
* @param options The hash options to use including min/max range
* @returns {number} A number within the specified range
*/
function hashToNumberSync(object, options = {
	min: 0,
	max: 10,
	algorithm: "djb2",
	serialize: JSON.stringify
}) {
	const min = options?.min ?? 0;
	const max = options?.max ?? 10;
	const algorithm = options?.algorithm ?? "djb2";
	const serialize = options?.serialize ?? JSON.stringify;
	const hashLength = options?.hashLength ?? 16;
	if (min >= max) throw new Error(`Invalid range: min (${min}) must be less than max (${max})`);
	const objectString = serialize(object);
	return new Hashery().toNumberSync(objectString, {
		algorithm,
		min,
		max,
		hashLength
	});
}
function wrapSync(function_, options) {
	const { ttl, keyPrefix, cache, serialize } = options;
	return (...arguments_) => {
		let cacheKey = createWrapKey(function_, arguments_, {
			keyPrefix,
			serialize
		});
		if (options.createKey) cacheKey = options.createKey(function_, arguments_, options);
		let value = cache.get(cacheKey);
		if (value === void 0) try {
			value = function_(...arguments_);
			cache.set(cacheKey, value, ttl);
		} catch (error) {
			cache.emit("error", error);
			if (options.cacheErrors) cache.set(cacheKey, error, ttl);
		}
		return value;
	};
}
/**
* Synchronous counterpart to {@link getOrSet}. Reads `key` from the cache and, on a miss, computes
* the value with `function_`, stores it, and returns it.
*
* Unlike {@link getOrSet} there is no request coalescing: synchronous code runs to completion
* without interleaving, so concurrent callers cannot stampede the setter the way they can with an
* async cache.
*
* Error handling mirrors {@link getOrSet}: errors are emitted on the cache's `error` event, can be
* cached when `cacheErrors` is set, and can be rethrown selectively via `throwErrors` (`true` for
* any error, `"function"` for setter errors, `"store"` for cache read/write errors).
*
* @param key - The cache key, or a function that derives it from the resolved options.
* @param function_ - The setter invoked on a cache miss to compute the value.
* @param options - The {@link GetOrSetSyncOptions} including the target synchronous cache.
* @returns The cached or freshly computed value, or `undefined`.
*/
function getOrSetSync(key, function_, options) {
	const keyString = typeof key === "function" ? key(options) : key;
	let value;
	try {
		value = options.cache.get(keyString);
	} catch (error) {
		options.cache.emit("error", error);
		if (options.throwErrors === true || options.throwErrors === "store") throw error;
	}
	if (value === void 0) try {
		try {
			value = function_();
		} catch (error) {
			throw new ErrorEnvelope(error, "function");
		}
		try {
			options.cache.set(keyString, value, options.ttl);
		} catch (error) {
			throw new ErrorEnvelope(error, "store");
		}
	} catch (caught) {
		const errorType = caught instanceof ErrorEnvelope ? caught.context : void 0;
		const error = caught instanceof ErrorEnvelope ? caught.error : caught;
		options.cache.emit("error", error);
		if (options.cacheErrors && errorType === "function") try {
			options.cache.set(keyString, error, options.ttl);
		} catch (storeError) {
			options.cache.emit("error", storeError);
		}
		if (options.throwErrors === true || options.throwErrors === errorType) throw error;
	}
	return value;
}
function createWrapKey(function_, arguments_, options) {
	const { keyPrefix, serialize } = options || {};
	if (!keyPrefix) return `${function_.name}::${hashSync(arguments_, { serialize })}`;
	return `${keyPrefix}::${function_.name}::${hashSync(arguments_, { serialize })}`;
}
var ErrorEnvelope = class {
	error;
	context;
	constructor(error, context) {
		this.error = error;
		this.context = context;
	}
};
var Stats = class {
	_counters = {
		hits: 0,
		misses: 0,
		gets: 0,
		sets: 0,
		deletes: 0,
		clears: 0,
		count: 0
	};
	_vsize = 0;
	_ksize = 0;
	_enabled = false;
	_lastUpdated;
	_lastReset;
	_subscriptions = [];
	/** Backing store for the public {@link trackedKeys} read-only view. */
	_trackedKeys = /* @__PURE__ */ new Map();
	_trackKeys = false;
	_maxTrackedKeys;
	constructor(options) {
		if (options?.enabled) this._enabled = options.enabled;
		if (options?.trackKeys) this._trackKeys = options.trackKeys;
		if (options?.maxTrackedKeys !== void 0) this._maxTrackedKeys = options.maxTrackedKeys;
		if (options?.emitter && options?.eventMap) this.subscribe(options.emitter, options.eventMap);
	}
	/**
	* @returns {boolean} - Whether the stats are enabled
	*/
	get enabled() {
		return this._enabled;
	}
	/**
	* @param {boolean} enabled - Whether to enable the stats
	*/
	set enabled(enabled) {
		this._enabled = enabled;
	}
	/**
	* @returns {boolean} - Whether per-key statistics are tracked
	*/
	get trackKeys() {
		return this._trackKeys;
	}
	/**
	* @param {boolean} trackKeys - Whether to track per-key statistics
	*/
	set trackKeys(trackKeys) {
		this._trackKeys = trackKeys;
	}
	/**
	* @returns {number | undefined} - The cap on unique keys tracked, or
	* `undefined` when unbounded
	*/
	get maxTrackedKeys() {
		return this._maxTrackedKeys;
	}
	/**
	* @param {number | undefined} maxTrackedKeys - The cap on unique keys
	* tracked. Set `undefined` for unbounded.
	*/
	set maxTrackedKeys(maxTrackedKeys) {
		this._maxTrackedKeys = maxTrackedKeys;
	}
	/**
	* Per-key statistics, keyed by cache key, holding each key's raw
	* `hits`/`misses`/`gets`/`sets`/`deletes` counters. Populated by
	* {@link recordKey} when {@link trackKeys} is enabled; read `trackedKeys.size`
	* for the number of unique keys currently tracked. The returned map is a
	* read-only view — mutate per-key stats via {@link recordKey} /
	* {@link clearKeys} / {@link reset}.
	* @returns {ReadonlyMap<string, Readonly<KeyCounters>>}
	* @readonly
	*/
	get trackedKeys() {
		return this._trackedKeys;
	}
	/**
	* @returns {number} - The number of hits
	* @readonly
	*/
	get hits() {
		return this._counters.hits;
	}
	/**
	* @returns {number} - The number of misses
	* @readonly
	*/
	get misses() {
		return this._counters.misses;
	}
	/**
	* @returns {number} - The number of gets
	* @readonly
	*/
	get gets() {
		return this._counters.gets;
	}
	/**
	* @returns {number} - The number of sets
	* @readonly
	*/
	get sets() {
		return this._counters.sets;
	}
	/**
	* @returns {number} - The number of deletes
	* @readonly
	*/
	get deletes() {
		return this._counters.deletes;
	}
	/**
	* @returns {number} - The number of clears
	* @readonly
	*/
	get clears() {
		return this._counters.clears;
	}
	/**
	* @returns {number} - The vsize (value size) of the cache instance
	* @readonly
	*/
	get vsize() {
		return this._vsize;
	}
	/**
	* @returns {number} - The ksize (key size) of the cache instance
	* @readonly
	*/
	get ksize() {
		return this._ksize;
	}
	/**
	* @returns {number} - The count of the cache instance
	* @readonly
	*/
	get count() {
		return this._counters.count;
	}
	/**
	* The ratio of hits to total lookups (hits + misses). Returns `0` when there
	* have been no lookups.
	* @returns {number} - A value between 0 and 1
	* @readonly
	*/
	get hitRate() {
		const total = this._counters.hits + this._counters.misses;
		return total === 0 ? 0 : this._counters.hits / total;
	}
	/**
	* The ratio of misses to total lookups (hits + misses). Returns `0` when
	* there have been no lookups.
	* @returns {number} - A value between 0 and 1
	* @readonly
	*/
	get missRate() {
		const total = this._counters.hits + this._counters.misses;
		return total === 0 ? 0 : this._counters.misses / total;
	}
	/**
	* The timestamp (ms since epoch) of the last mutation while enabled, or
	* `undefined` if there have been none since the last reset.
	* @returns {number | undefined}
	* @readonly
	*/
	get lastUpdated() {
		return this._lastUpdated;
	}
	/**
	* The timestamp (ms since epoch) of the last {@link reset}/{@link clear}, or
	* `undefined` if it has never been reset.
	* @returns {number | undefined}
	* @readonly
	*/
	get lastReset() {
		return this._lastReset;
	}
	/**
	* Increment a counter field by `amount` (default `1`). No-op when disabled.
	* @param {StatField} field - The counter to increment
	* @param {number} amount - The amount to add (default 1)
	*/
	increment(field, amount = 1) {
		if (!this._enabled) return;
		this._counters[field] += amount;
		this.touch();
	}
	/**
	* Decrement a counter field by `amount` (default `1`). No-op when disabled.
	* @param {StatField} field - The counter to decrement
	* @param {number} amount - The amount to subtract (default 1)
	*/
	decrement(field, amount = 1) {
		if (!this._enabled) return;
		this._counters[field] -= amount;
		this.touch();
	}
	incrementHits(amount = 1) {
		this.increment("hits", amount);
	}
	incrementMisses(amount = 1) {
		this.increment("misses", amount);
	}
	incrementGets(amount = 1) {
		this.increment("gets", amount);
	}
	incrementSets(amount = 1) {
		this.increment("sets", amount);
	}
	incrementDeletes(amount = 1) {
		this.increment("deletes", amount);
	}
	incrementClears(amount = 1) {
		this.increment("clears", amount);
	}
	incrementVSize(value) {
		if (!this._enabled) return;
		this._vsize += this.roughSizeOfObject(value);
		this.touch();
	}
	decreaseVSize(value) {
		if (!this._enabled) return;
		this._vsize = Math.max(0, this._vsize - this.roughSizeOfObject(value));
		this.touch();
	}
	incrementKSize(key) {
		if (!this._enabled) return;
		this._ksize += this.roughSizeOfString(key);
		this.touch();
	}
	decreaseKSize(key) {
		if (!this._enabled) return;
		this._ksize = Math.max(0, this._ksize - this.roughSizeOfString(key));
		this.touch();
	}
	incrementCount(amount = 1) {
		this.increment("count", amount);
	}
	decreaseCount(amount = 1) {
		if (!this._enabled) return;
		this._counters.count = Math.max(0, this._counters.count - amount);
		this.touch();
	}
	setCount(count) {
		if (!this._enabled) return;
		this._counters.count = count;
		this.touch();
	}
	roughSizeOfString(value) {
		return value.length * 2;
	}
	roughSizeOfObject(object) {
		const objectList = [];
		const stack = [object];
		let bytes = 0;
		while (stack.length > 0) {
			const value = stack.pop();
			if (typeof value === "boolean") bytes += 4;
			else if (typeof value === "string") bytes += value.length * 2;
			else if (typeof value === "number") bytes += 8;
			else {
				if (value === null || value === void 0) {
					bytes += 4;
					continue;
				}
				if (objectList.includes(value)) continue;
				objectList.push(value);
				for (const key in value) {
					bytes += key.length * 2;
					stack.push(value[key]);
				}
			}
		}
		return bytes;
	}
	/**
	* Enable stat tracking. Equivalent to setting {@link enabled} to `true`.
	*/
	enable() {
		this._enabled = true;
	}
	/**
	* Disable stat tracking. Equivalent to setting {@link enabled} to `false`.
	*/
	disable() {
		this._enabled = false;
	}
	/**
	* Reset all counters to zero and record the reset timestamp. Alias of
	* {@link reset}.
	*/
	clear() {
		this.reset();
	}
	reset() {
		this._counters = {
			hits: 0,
			misses: 0,
			gets: 0,
			sets: 0,
			deletes: 0,
			clears: 0,
			count: 0
		};
		this._vsize = 0;
		this._ksize = 0;
		this._trackedKeys.clear();
		this._lastReset = Date.now();
		this._lastUpdated = void 0;
	}
	resetStoreValues() {
		this._vsize = 0;
		this._ksize = 0;
		this._counters.count = 0;
	}
	/**
	* @returns {StatsSnapshot} - A plain-object snapshot of the current stats,
	* including computed `hitRate`/`missRate` and timestamps.
	*/
	toJSON() {
		return {
			enabled: this._enabled,
			hits: this._counters.hits,
			misses: this._counters.misses,
			gets: this._counters.gets,
			sets: this._counters.sets,
			deletes: this._counters.deletes,
			clears: this._counters.clears,
			vsize: this._vsize,
			ksize: this._ksize,
			count: this._counters.count,
			hitRate: this.hitRate,
			missRate: this.missRate,
			trackedKeys: this._trackedKeys.size,
			lastUpdated: this._lastUpdated,
			lastReset: this._lastReset
		};
	}
	/**
	* @returns {StatsSnapshot} - A plain-object snapshot of the current stats.
	* Alias of {@link toJSON}.
	*/
	snapshot() {
		return this.toJSON();
	}
	/**
	* Record an operation against a specific key for per-key statistics. No-op
	* unless both {@link enabled} and {@link trackKeys} are `true`.
	* @param {string} key - The cache key the operation touched
	* @param {KeyStatField} field - The per-key counter to increment
	* @param {number} amount - The amount to add (default 1)
	*/
	recordKey(key, field, amount = 1) {
		if (!this._enabled || !this._trackKeys) return;
		let counters = this._trackedKeys.get(key);
		if (!counters) {
			counters = {
				hits: 0,
				misses: 0,
				gets: 0,
				sets: 0,
				deletes: 0
			};
			this._trackedKeys.set(key, counters);
			this.pruneTrackedKeys(key);
		}
		counters[field] += amount;
		this.touch();
	}
	/**
	* The most-used keys, sorted descending. Sorts by total recorded operations,
	* or by a single field when `field` is provided. Ties order by key.
	* @param {number} limit - Maximum entries to return (default 100)
	* @param {KeyStatField} [field] - Optionally rank by one counter (e.g. "hits")
	* @returns {StatsKeyEntry[]}
	*/
	mostUsedKeys(limit = 100, field) {
		return this.sortedKeyEntries(field, "desc").slice(0, limit);
	}
	/**
	* The least-used keys, sorted ascending. Sorts by total recorded operations,
	* or by a single field when `field` is provided. Ties order by key. Note:
	* only keys that have been recorded at least once can be ranked, and when
	* {@link maxTrackedKeys} pruning has occurred the true least-used keys may
	* have been evicted.
	* @param {number} limit - Maximum entries to return (default 100)
	* @param {KeyStatField} [field] - Optionally rank by one counter (e.g. "gets")
	* @returns {StatsKeyEntry[]}
	*/
	leastUsedKeys(limit = 100, field) {
		return this.sortedKeyEntries(field, "asc").slice(0, limit);
	}
	/**
	* @param {string} key - The key to look up
	* @returns {StatsKeyEntry | undefined} - The per-key statistics, or
	* `undefined` if the key has not been recorded
	*/
	keyStats(key) {
		const counters = this._trackedKeys.get(key);
		return counters ? this.toKeyEntry(key, counters) : void 0;
	}
	/**
	* Clear all per-key statistics without touching the aggregate counters.
	*/
	clearKeys() {
		this._trackedKeys.clear();
	}
	totalOf(counters) {
		return counters.hits + counters.misses + counters.gets + counters.sets + counters.deletes;
	}
	toKeyEntry(key, counters) {
		const lookups = counters.hits + counters.misses;
		return {
			key,
			count: this.totalOf(counters),
			hits: counters.hits,
			misses: counters.misses,
			gets: counters.gets,
			sets: counters.sets,
			deletes: counters.deletes,
			hitRate: lookups === 0 ? 0 : counters.hits / lookups
		};
	}
	sortedKeyEntries(field, direction) {
		const entries = [];
		for (const [key, counters] of this._trackedKeys) entries.push(this.toKeyEntry(key, counters));
		const sign = direction === "asc" ? 1 : -1;
		entries.sort((a, b) => {
			const valueA = field ? a[field] : a.count;
			const valueB = field ? b[field] : b.count;
			if (valueA !== valueB) return (valueA - valueB) * sign;
			return a.key < b.key ? -1 : 1;
		});
		return entries;
	}
	/**
	* When over {@link maxTrackedKeys}, prune the lowest-count keys down to 90%
	* of the cap (batched so the sort cost amortizes across inserts). The key
	* that was just recorded is never pruned.
	*/
	pruneTrackedKeys(protectedKey) {
		if (this._maxTrackedKeys === void 0 || this._trackedKeys.size <= this._maxTrackedKeys) return;
		const target = Math.max(1, Math.floor(this._maxTrackedKeys * .9));
		const sorted = [...this._trackedKeys.entries()].sort((a, b) => this.totalOf(a[1]) - this.totalOf(b[1]));
		for (const [key] of sorted) {
			if (this._trackedKeys.size <= target) break;
			if (key === protectedKey) continue;
			this._trackedKeys.delete(key);
		}
	}
	/**
	* Subscribe to an emitter so that matching events automatically update the
	* stats. Counting is gated by {@link enabled}, so you may subscribe first and
	* toggle enablement later. Call {@link unsubscribe} to detach.
	* @param {StatsEmitter} emitter - The emitter to listen on
	* @param {StatsEventMap} eventMap - The event-to-stat mapping (e.g.
	* {@link nodeCacheStatsEventMap} or a custom map)
	*/
	subscribe(emitter, eventMap) {
		for (const [event, action] of Object.entries(eventMap)) {
			const listener = (...args) => {
				this.applyEvent(action, args);
			};
			emitter.on(event, listener);
			this._subscriptions.push({
				emitter,
				event,
				listener
			});
		}
	}
	/**
	* Detach listeners previously attached via {@link subscribe}. When `emitter`
	* is provided, only that emitter's listeners are removed; otherwise all are.
	* @param {StatsEmitter} [emitter] - The emitter to detach from
	*/
	unsubscribe(emitter) {
		const remaining = [];
		for (const sub of this._subscriptions) {
			if (emitter && sub.emitter !== emitter) {
				remaining.push(sub);
				continue;
			}
			(sub.emitter.off ?? sub.emitter.removeListener)?.call(sub.emitter, sub.event, sub.listener);
		}
		this._subscriptions = remaining;
	}
	applyEvent(action, args) {
		if (!this._enabled) return;
		if (typeof action === "function") {
			action(this, ...args);
			return;
		}
		if (Array.isArray(action)) {
			for (const field of action) this.increment(field);
			return;
		}
		this.increment(action);
	}
	touch() {
		this._lastUpdated = Date.now();
	}
};
//#endregion
//#region node_modules/@cacheable/memory/dist/index.mjs
var ListNode = class {
	value;
	prev = void 0;
	next = void 0;
	constructor(value) {
		this.value = value;
	}
};
var DoublyLinkedList = class {
	head = void 0;
	tail = void 0;
	nodesMap = /* @__PURE__ */ new Map();
	addToFront(value) {
		const newNode = new ListNode(value);
		if (this.head) {
			newNode.next = this.head;
			this.head.prev = newNode;
			this.head = newNode;
		} else this.head = this.tail = newNode;
		this.nodesMap.set(value, newNode);
	}
	moveToFront(value) {
		const node = this.nodesMap.get(value);
		if (!node || this.head === node) return;
		/* v8 ignore next -- @preserve */
		if (node.prev) node.prev.next = node.next;
		/* v8 ignore next -- @preserve */
		if (node.next) node.next.prev = node.prev;
		/* v8 ignore next -- @preserve */
		if (node === this.tail) this.tail = node.prev;
		node.prev = void 0;
		node.next = this.head;
		/* v8 ignore next -- @preserve */
		if (this.head) this.head.prev = node;
		this.head = node;
		this.tail ??= node;
	}
	getOldest() {
		/* v8 ignore next -- @preserve */
		return this.tail ? this.tail.value : void 0;
	}
	removeOldest() {
		/* v8 ignore next -- @preserve */
		if (!this.tail) return;
		const oldValue = this.tail.value;
		/* v8 ignore next -- @preserve */
		if (this.tail.prev) {
			this.tail = this.tail.prev;
			this.tail.next = void 0;
		} else
 /* v8 ignore next -- @preserve */
		this.head = this.tail = void 0;
		this.nodesMap.delete(oldValue);
		return oldValue;
	}
	remove(value) {
		const node = this.nodesMap.get(value);
		if (!node) return false;
		if (node.prev) node.prev.next = node.next;
		else {
			this.head = node.next;
			if (this.head) this.head.prev = void 0;
		}
		if (node.next) node.next.prev = node.prev;
		else {
			this.tail = node.prev;
			if (this.tail) this.tail.next = void 0;
		}
		this.nodesMap.delete(value);
		return true;
	}
	get size() {
		return this.nodesMap.size;
	}
};
var maximumMapSize = 16777216;
var CacheableMemory = class extends Hookified {
	_lru = new DoublyLinkedList();
	_storeHashSize = 16;
	_storeHashAlgorithm = HashAlgorithm.DJB2;
	_store = Array.from({ length: this._storeHashSize }, () => /* @__PURE__ */ new Map());
	_ttl;
	_maxTtl;
	_useClone = true;
	_lruSize = 0;
	_checkInterval = 0;
	_interval = 0;
	_stats = new Stats({ enabled: false });
	/**
	* @constructor
	* @param {CacheableMemoryOptions} [options] - The options for the CacheableMemory
	*/
	constructor(options) {
		super();
		if (options?.ttl) this.setTtl(options.ttl);
		if (options?.maxTtl !== void 0) this.setMaxTtl(options.maxTtl);
		if (options?.useClone !== void 0) this._useClone = options.useClone;
		if (options?.stats) this._stats.enabled = options.stats;
		if (options?.storeHashSize && options.storeHashSize > 0) this._storeHashSize = options.storeHashSize;
		if (options?.lruSize) if (options.lruSize > 16777216) this.emit("error", /* @__PURE__ */ new Error(`LRU size cannot be larger than ${maximumMapSize} due to Map limitations.`));
		else this._lruSize = options.lruSize;
		if (options?.checkInterval) this._checkInterval = options.checkInterval;
		if (options?.storeHashAlgorithm) this._storeHashAlgorithm = options.storeHashAlgorithm;
		this._store = Array.from({ length: this._storeHashSize }, () => /* @__PURE__ */ new Map());
		this.startIntervalCheck();
	}
	/**
	* Gets the time-to-live
	* @returns {number|string|undefined} - The time-to-live in miliseconds or a human-readable format. If undefined, it will not have a time-to-live.
	*/
	get ttl() {
		return this._ttl;
	}
	/**
	* Sets the time-to-live
	* @param {number|string|undefined} value - The time-to-live in miliseconds or a human-readable format (example '1s' = 1 second, '1h' = 1 hour). If undefined, it will not have a time-to-live.
	*/
	set ttl(value) {
		this.setTtl(value);
	}
	/**
	* Gets the maximum time-to-live. When set, any TTL that exceeds this value is capped to maxTtl.
	* Entries with no TTL will also be capped to maxTtl. Default is `undefined` (no maximum).
	* @returns {number|string|undefined} - The maximum TTL in milliseconds, human-readable format, or undefined.
	*/
	get maxTtl() {
		return this._maxTtl;
	}
	/**
	* Sets the maximum time-to-live. When set, any TTL that exceeds this value is capped to maxTtl.
	* Entries with no TTL will also be capped to maxTtl.
	* @param {number|string|undefined} value - The maximum TTL in milliseconds or human-readable format (e.g. '1s', '1h'). If undefined, no maximum is enforced.
	*/
	set maxTtl(value) {
		this.setMaxTtl(value);
	}
	/**
	* Gets whether to use clone
	* @returns {boolean} - If true, it will clone the value before returning it. If false, it will return the value directly. Default is true.
	*/
	get useClone() {
		return this._useClone;
	}
	/**
	* Sets whether to use clone
	* @param {boolean} value - If true, it will clone the value before returning it. If false, it will return the value directly. Default is true.
	*/
	set useClone(value) {
		this._useClone = value;
	}
	/**
	* Gets the size of the LRU cache
	* @returns {number} - The size of the LRU cache. If set to 0, it will not use LRU cache. Default is 0. If you are using LRU then the limit is based on Map() size 17mm.
	*/
	get lruSize() {
		return this._lruSize;
	}
	/**
	* Sets the size of the LRU cache
	* @param {number} value - The size of the LRU cache. If set to 0, it will not use LRU cache. Default is 0. If you are using LRU then the limit is based on Map() size 17mm.
	*/
	set lruSize(value) {
		if (value > 16777216) {
			this.emit("error", /* @__PURE__ */ new Error(`LRU size cannot be larger than ${maximumMapSize} due to Map limitations.`));
			return;
		}
		this._lruSize = value;
		if (this._lruSize === 0) {
			this._lru = new DoublyLinkedList();
			return;
		}
		this.lruResize();
	}
	/**
	* Gets the check interval
	* @returns {number} - The interval to check for expired items. If set to 0, it will not check for expired items. Default is 0.
	*/
	get checkInterval() {
		return this._checkInterval;
	}
	/**
	* Sets the check interval
	* @param {number} value - The interval to check for expired items. If set to 0, it will not check for expired items. Default is 0.
	*/
	set checkInterval(value) {
		this._checkInterval = value;
	}
	/**
	* Gets the size of the cache
	* @returns {number} - The size of the cache
	*/
	get size() {
		let size = 0;
		for (const store of this._store) size += store.size;
		return size;
	}
	/**
	* Gets the statistics of the cache. Statistics track aggregate counters such as `hits`, `misses`,
	* `gets`, `sets`, `deletes`, `clears`, `count`, `ksize`, and `vsize`. They are disabled by default;
	* enable them via the `stats` option or by setting `cache.stats.enabled = true`.
	* @returns {Stats} - The statistics for this CacheableMemory instance
	*/
	get stats() {
		return this._stats;
	}
	/**
	* Gets the number of hash stores
	* @returns {number} - The number of hash stores
	*/
	get storeHashSize() {
		return this._storeHashSize;
	}
	/**
	* Sets the number of hash stores. This will recreate the store and all data will be cleared
	* @param {number} value - The number of hash stores
	*/
	set storeHashSize(value) {
		if (value === this._storeHashSize) return;
		this._storeHashSize = value;
		this._store = Array.from({ length: this._storeHashSize }, () => /* @__PURE__ */ new Map());
		if (this._stats.enabled) this._stats.resetStoreValues();
	}
	/**
	* Gets the store hash algorithm
	* @returns {HashAlgorithm | StoreHashAlgorithmFunction} - The store hash algorithm
	*/
	get storeHashAlgorithm() {
		return this._storeHashAlgorithm;
	}
	/**
	* Sets the store hash algorithm. This will recreate the store and all data will be cleared
	* @param {HashAlgorithm | HashAlgorithmFunction} value - The store hash algorithm
	*/
	set storeHashAlgorithm(value) {
		this._storeHashAlgorithm = value;
	}
	/**
	* Gets the keys
	* @returns {IterableIterator<string>} - The keys
	*/
	get keys() {
		const keys = [];
		for (const store of this._store) for (const key of store.keys()) {
			const item = store.get(key);
			if (item && this.hasExpired(item)) {
				this.recordExpiration(item);
				store.delete(key);
				this.lruRemove(key);
				continue;
			}
			keys.push(key);
		}
		return keys.values();
	}
	/**
	* Gets the items
	* @returns {IterableIterator<CacheableStoreItem>} - The items
	*/
	get items() {
		const items = [];
		for (const store of this._store) for (const item of store.values()) {
			if (this.hasExpired(item)) {
				this.recordExpiration(item);
				store.delete(item.key);
				this.lruRemove(item.key);
				continue;
			}
			items.push(item);
		}
		return items.values();
	}
	/**
	* Gets the store
	* @returns {Array<Map<string, CacheableStoreItem>>} - The store
	*/
	get store() {
		return this._store;
	}
	/**
	* Gets the value of the key
	* @param {string} key - The key to get the value
	* @returns {T | undefined} - The value of the key
	*/
	get(key) {
		this.hookSync("BEFORE_GET", key);
		const store = this.getStore(key);
		const item = store.get(key);
		if (!item) {
			this.recordRead(false);
			this.hookSync("AFTER_GET", {
				key,
				result: void 0
			});
			return;
		}
		if (item.expires && Date.now() > item.expires) {
			this.recordExpiration(item);
			store.delete(key);
			this.lruRemove(key);
			this.recordRead(false);
			this.hookSync("AFTER_GET", {
				key,
				result: void 0
			});
			return;
		}
		this.lruMoveToFront(key);
		let result;
		if (!this._useClone) result = item.value;
		else result = this.clone(item.value);
		this.recordRead(true);
		this.hookSync("AFTER_GET", {
			key,
			result
		});
		return result;
	}
	/**
	* Gets the values of the keys
	* @param {string[]} keys - The keys to get the values
	* @returns {T[]} - The values of the keys
	*/
	getMany(keys) {
		this.hookSync("BEFORE_GET_MANY", keys);
		const result = [];
		for (const key of keys) result.push(this.get(key));
		this.hookSync("AFTER_GET_MANY", {
			keys,
			result
		});
		return result;
	}
	/**
	* Gets the raw value of the key
	* @param {string} key - The key to get the value
	* @returns {CacheableStoreItem | undefined} - The raw value of the key
	*/
	getRaw(key) {
		const store = this.getStore(key);
		const item = store.get(key);
		if (!item) {
			this.recordRead(false);
			return;
		}
		if (item.expires && Date.now() > item.expires) {
			this.recordExpiration(item);
			store.delete(key);
			this.lruRemove(key);
			this.recordRead(false);
			return;
		}
		this.lruMoveToFront(key);
		this.recordRead(true);
		return item;
	}
	/**
	* Gets the raw values of the keys
	* @param {string[]} keys - The keys to get the values
	* @returns {CacheableStoreItem[]} - The raw values of the keys
	*/
	getManyRaw(keys) {
		const result = [];
		for (const key of keys) result.push(this.getRaw(key));
		return result;
	}
	/**
	* Sets the value of the key
	* @param {string} key - The key to set the value
	* @param {any} value - The value to set
	* @param {number|string|SetOptions} [ttl] - Time to Live - If you set a number it is miliseconds, if you set a string it is a human-readable.
	* If you want to set expire directly you can do that by setting the expire property in the SetOptions.
	* If you set undefined, it will use the default time-to-live. If both are undefined then it will not have a time-to-live.
	* @returns {void}
	*/
	set(key, value, ttl) {
		const hookItem = {
			key,
			value,
			ttl
		};
		this.hookSync("BEFORE_SET", hookItem);
		const store = this.getStore(hookItem.key);
		let expires;
		const effectiveTtl = hookItem.ttl;
		if (effectiveTtl !== void 0 || this._ttl !== void 0) if (typeof effectiveTtl === "object") {
			if (effectiveTtl.expire) expires = typeof effectiveTtl.expire === "number" ? effectiveTtl.expire : effectiveTtl.expire.getTime();
			if (effectiveTtl.ttl) {
				const finalTtl = shorthandToTime(effectiveTtl.ttl);
				/* v8 ignore next -- @preserve */
				if (finalTtl !== void 0) expires = finalTtl;
			}
		} else {
			const finalTtl = shorthandToTime(effectiveTtl ?? this._ttl);
			/* v8 ignore next -- @preserve */
			if (finalTtl !== void 0) expires = finalTtl;
		}
		if (this._maxTtl !== void 0) {
			const maxExpires = shorthandToTime(this._maxTtl);
			if (expires === void 0) expires = maxExpires;
			else if (expires > maxExpires) expires = maxExpires;
		}
		if (this._lruSize > 0) if (store.has(hookItem.key)) this.lruMoveToFront(hookItem.key);
		else {
			this.lruAddToFront(hookItem.key);
			if (this._lru.size > this._lruSize) {
				const oldestKey = this._lru.getOldest();
				/* v8 ignore next -- @preserve */
				if (oldestKey) {
					this._lru.removeOldest();
					this.delete(oldestKey);
				}
			}
		}
		if (this._stats.enabled) {
			const existing = store.get(hookItem.key);
			if (existing) this._stats.decreaseVSize(existing.value);
			else {
				this._stats.incrementKSize(hookItem.key);
				this._stats.incrementCount();
			}
			this._stats.incrementVSize(hookItem.value);
			this._stats.incrementSets();
		}
		const item = {
			key: hookItem.key,
			value: hookItem.value,
			expires
		};
		store.set(hookItem.key, item);
		this.hookSync("AFTER_SET", hookItem);
	}
	/**
	* Sets the values of the keys
	* @param {CacheableItem[]} items - The items to set
	* @returns {void}
	*/
	setMany(items) {
		this.hookSync("BEFORE_SET_MANY", items);
		for (const item of items) this.set(item.key, item.value, item.ttl);
		this.hookSync("AFTER_SET_MANY", items);
	}
	/**
	* Checks if the key exists
	* @param {string} key - The key to check
	* @returns {boolean} - If true, the key exists. If false, the key does not exist.
	*/
	has(key) {
		const item = this.get(key);
		return Boolean(item);
	}
	/**
	* @function hasMany
	* @param {string[]} keys - The keys to check
	* @returns {boolean[]} - If true, the key exists. If false, the key does not exist.
	*/
	hasMany(keys) {
		const result = [];
		for (const key of keys) {
			const item = this.get(key);
			result.push(Boolean(item));
		}
		return result;
	}
	/**
	* Take will get the key and delete the entry from cache
	* @param {string} key - The key to take
	* @returns {T | undefined} - The value of the key
	*/
	take(key) {
		const item = this.get(key);
		if (!item) return;
		this.delete(key);
		return item;
	}
	/**
	* TakeMany will get the keys and delete the entries from cache
	* @param {string[]} keys - The keys to take
	* @returns {T[]} - The values of the keys
	*/
	takeMany(keys) {
		const result = [];
		for (const key of keys) result.push(this.take(key));
		return result;
	}
	/**
	* Delete the key
	* @param {string} key - The key to delete
	* @returns {void}
	*/
	delete(key) {
		this.hookSync("BEFORE_DELETE", key);
		const store = this.getStore(key);
		if (this._stats.enabled) {
			const item = store.get(key);
			if (item) {
				this._stats.decreaseKSize(key);
				this._stats.decreaseVSize(item.value);
				this._stats.decreaseCount();
				this._stats.incrementDeletes();
			}
		}
		store.delete(key);
		this.lruRemove(key);
		this.hookSync("AFTER_DELETE", key);
	}
	/**
	* Delete the keys
	* @param {string[]} keys - The keys to delete
	* @returns {void}
	*/
	deleteMany(keys) {
		this.hookSync("BEFORE_DELETE_MANY", keys);
		for (const key of keys) this.delete(key);
		this.hookSync("AFTER_DELETE_MANY", keys);
	}
	/**
	* Clear the cache
	* @returns {void}
	*/
	clear() {
		this.hookSync("BEFORE_CLEAR");
		this._store = Array.from({ length: this._storeHashSize }, () => /* @__PURE__ */ new Map());
		this._lru = new DoublyLinkedList();
		if (this._stats.enabled) {
			this._stats.resetStoreValues();
			this._stats.incrementClears();
		}
		this.hookSync("AFTER_CLEAR");
	}
	/**
	* Get the store based on the key (internal use)
	* @param {string} key - The key to get the store
	* @returns {CacheableHashStore} - The store
	*/
	getStore(key) {
		const hash = this.getKeyStoreHash(key);
		this._store[hash] ||= /* @__PURE__ */ new Map();
		return this._store[hash];
	}
	/**
	* Hash the key for which store to go to (internal use)
	* @param {string} key - The key to hash
	* Available algorithms are: SHA256, SHA1, MD5, and djb2Hash.
	* @returns {number} - The hashed key as a number
	*/
	getKeyStoreHash(key) {
		if (this._store.length === 1) return 0;
		if (typeof this._storeHashAlgorithm === "function") return this._storeHashAlgorithm(key, this._storeHashSize);
		return hashToNumberSync(key, {
			min: 0,
			max: this._storeHashSize - 1,
			algorithm: this._storeHashAlgorithm
		});
	}
	/**
	* Clone the value. This is for internal use
	* @param {any} value - The value to clone
	* @returns {any} - The cloned value
	*/
	clone(value) {
		if (this.isPrimitive(value)) return value;
		return structuredClone(value);
	}
	/**
	* Add to the front of the LRU cache. This is for internal use
	* @param {string} key - The key to add to the front
	* @returns {void}
	*/
	lruAddToFront(key) {
		if (this._lruSize === 0) return;
		this._lru.addToFront(key);
	}
	/**
	* Move to the front of the LRU cache. This is for internal use
	* @param {string} key - The key to move to the front
	* @returns {void}
	*/
	lruMoveToFront(key) {
		if (this._lruSize === 0) return;
		this._lru.moveToFront(key);
	}
	/**
	* Remove a key from the LRU cache. This is for internal use
	* @param {string} key - The key to remove
	* @returns {void}
	*/
	lruRemove(key) {
		if (this._lruSize === 0) return;
		this._lru.remove(key);
	}
	/**
	* Resize the LRU cache. This is for internal use.
	* @returns {void}
	*/
	lruResize() {
		while (this._lru.size > this._lruSize) {
			const oldestKey = this._lru.getOldest();
			/* v8 ignore next -- @preserve */
			if (oldestKey) {
				this._lru.removeOldest();
				this.delete(oldestKey);
			}
		}
	}
	/**
	* Check for expiration. This is for internal use
	* @returns {void}
	*/
	checkExpiration() {
		for (const store of this._store) for (const item of store.values()) if (item.expires && Date.now() > item.expires) {
			this.recordExpiration(item);
			store.delete(item.key);
			this.lruRemove(item.key);
		}
	}
	/**
	* Start the interval check. This is for internal use
	* @returns {void}
	*/
	startIntervalCheck() {
		if (this._checkInterval > 0) {
			/* v8 ignore next -- @preserve */
			if (this._interval)
 /* v8 ignore next -- @preserve */
			clearInterval(this._interval);
			this._interval = setInterval(() => {
				this.checkExpiration();
			}, this._checkInterval).unref();
		}
	}
	/**
	* Stop the interval check. This is for internal use
	* @returns {void}
	*/
	stopIntervalCheck() {
		/* v8 ignore next -- @preserve */
		if (this._interval) clearInterval(this._interval);
		this._interval = 0;
		this._checkInterval = 0;
	}
	/**
	* Wrap the function for caching
	* @param {Function} function_ - The function to wrap
	* @param {Object} [options] - The options to wrap
	* @returns {Function} - The wrapped function
	*/
	wrap(function_, options) {
		return wrapSync(function_, {
			ttl: options?.ttl ?? this._ttl,
			keyPrefix: options?.keyPrefix,
			createKey: options?.createKey,
			cache: this
		});
	}
	/**
	* Gets the value of the key, or computes and stores it on a cache miss. This is the synchronous
	* cache-aside helper: if the key is present its value is returned, otherwise `function_` is
	* invoked, its result is stored, and that result is returned.
	*
	* The value is stored using `options.ttl`, falling back to the instance default `ttl`. Because
	* the cache is synchronous there is no request coalescing — concurrent callers cannot stampede
	* the setter the way they can with an async cache.
	* @param {GetOrSetSyncKey} key - The key to get or set. Can also be a function that returns the key.
	* @param {() => T} function_ - The function that computes the value on a cache miss.
	* @param {GetOrSetFunctionOptions} [options] - Options such as `ttl`, `cacheErrors`, and `throwErrors`.
	* @returns {T | undefined} - The cached or freshly computed value
	*/
	getOrSet(key, function_, options) {
		return getOrSetSync(key, function_, {
			cache: this,
			ttl: options?.ttl ?? this._ttl,
			cacheErrors: options?.cacheErrors,
			throwErrors: options?.throwErrors
		});
	}
	/**
	* Records a single read against the statistics counters. Each read increments `gets` and either
	* `hits` or `misses`. No-op when statistics are disabled. This is for internal use.
	* @param {boolean} hit - Whether the read found a (non-expired) value
	* @returns {void}
	*/
	recordRead(hit) {
		if (!this._stats.enabled) return;
		if (hit) this._stats.incrementHits();
		else this._stats.incrementMisses();
		this._stats.incrementGets();
	}
	/**
	* Decrements the size statistics (`count`, `ksize`, and `vsize`) for an entry that is being removed
	* because it expired. Expirations are not counted as `deletes` since they are not user-initiated.
	* No-op when statistics are disabled. This is for internal use.
	* @param {CacheableStoreItem} item - The expired item being removed from the store
	* @returns {void}
	*/
	recordExpiration(item) {
		if (!this._stats.enabled) return;
		this._stats.decreaseKSize(item.key);
		this._stats.decreaseVSize(item.value);
		this._stats.decreaseCount();
	}
	isPrimitive(value) {
		const result = false;
		/* v8 ignore next -- @preserve */
		if (value === null || value === void 0) return true;
		if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return true;
		return result;
	}
	setTtl(ttl) {
		if (typeof ttl === "string" || ttl === void 0) this._ttl = ttl;
		else if (ttl > 0) this._ttl = ttl;
		else this._ttl = void 0;
	}
	setMaxTtl(maxTtl) {
		if (typeof maxTtl === "string" || maxTtl === void 0) this._maxTtl = maxTtl;
		else if (maxTtl > 0) this._maxTtl = maxTtl;
		else this._maxTtl = void 0;
	}
	hasExpired(item) {
		if (item.expires && Date.now() > item.expires) return true;
		return false;
	}
};
//#endregion
export { Hookified as i, Stats as n, shorthandToTime as r, CacheableMemory as t };
