import { t as __commonJSMin } from "../_runtime.mjs";
//#region node_modules/@hapi/hoek/lib/stringify.js
var require_stringify = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(...args) {
		try {
			return JSON.stringify(...args);
		} catch (err) {
			return "[Cannot display object: " + err.message + "]";
		}
	};
}));
//#endregion
//#region node_modules/@hapi/hoek/lib/error.js
var require_error = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Stringify = require_stringify();
	module.exports = class extends Error {
		constructor(args) {
			const msgs = args.filter((arg) => arg !== "").map((arg) => {
				return typeof arg === "string" ? arg : arg instanceof Error ? arg.message : Stringify(arg);
			});
			super(msgs.join(" ") || "Unknown error");
			if (typeof Error.captureStackTrace === "function") Error.captureStackTrace(this, exports.assert);
		}
	};
}));
//#endregion
//#region node_modules/@hapi/hoek/lib/assert.js
var require_assert = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var AssertError = require_error();
	module.exports = function(condition, ...args) {
		if (condition) return;
		if (args.length === 1 && args[0] instanceof Error) throw args[0];
		throw new AssertError(args);
	};
}));
//#endregion
//#region node_modules/@hapi/hoek/lib/reach.js
var require_reach = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Assert = require_assert();
	var internals = {};
	module.exports = function(obj, chain, options) {
		if (chain === false || chain === null || chain === void 0) return obj;
		options = options || {};
		if (typeof options === "string") options = { separator: options };
		const isChainArray = Array.isArray(chain);
		Assert(!isChainArray || !options.separator, "Separator option is not valid for array-based chain");
		const path = isChainArray ? chain : chain.split(options.separator || ".");
		let ref = obj;
		for (let i = 0; i < path.length; ++i) {
			let key = path[i];
			const type = options.iterables && internals.iterables(ref);
			if (Array.isArray(ref) || type === "set") {
				const number = Number(key);
				if (Number.isInteger(number)) key = number < 0 ? ref.length + number : number;
			}
			if (!ref || typeof ref === "function" && options.functions === false || !type && ref[key] === void 0) {
				Assert(!options.strict || i + 1 === path.length, "Missing segment", key, "in reach path ", chain);
				Assert(typeof ref === "object" || options.functions === true || typeof ref !== "function", "Invalid segment", key, "in reach path ", chain);
				ref = options.default;
				break;
			}
			if (!type) ref = ref[key];
			else if (type === "set") ref = [...ref][key];
			else ref = ref.get(key);
		}
		return ref;
	};
	internals.iterables = function(ref) {
		if (ref instanceof Set) return "set";
		if (ref instanceof Map) return "map";
	};
}));
//#endregion
//#region node_modules/@hapi/hoek/lib/types.js
var require_types = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var internals = {};
	exports = module.exports = {
		array: Array.prototype,
		buffer: Buffer && Buffer.prototype,
		date: Date.prototype,
		error: Error.prototype,
		generic: Object.prototype,
		map: Map.prototype,
		promise: Promise.prototype,
		regex: RegExp.prototype,
		set: Set.prototype,
		weakMap: WeakMap.prototype,
		weakSet: WeakSet.prototype
	};
	internals.typeMap = /* @__PURE__ */ new Map([
		["[object Error]", exports.error],
		["[object Map]", exports.map],
		["[object Promise]", exports.promise],
		["[object Set]", exports.set],
		["[object WeakMap]", exports.weakMap],
		["[object WeakSet]", exports.weakSet]
	]);
	exports.getInternalProto = function(obj) {
		if (Array.isArray(obj)) return exports.array;
		if (Buffer && obj instanceof Buffer) return exports.buffer;
		if (obj instanceof Date) return exports.date;
		if (obj instanceof RegExp) return exports.regex;
		if (obj instanceof Error) return exports.error;
		const objName = Object.prototype.toString.call(obj);
		return internals.typeMap.get(objName) || exports.generic;
	};
}));
//#endregion
//#region node_modules/@hapi/hoek/lib/utils.js
var require_utils = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.keys = function(obj, options = {}) {
		return options.symbols !== false ? Reflect.ownKeys(obj) : Object.getOwnPropertyNames(obj);
	};
}));
//#endregion
//#region node_modules/@hapi/hoek/lib/clone.js
var require_clone = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Reach = require_reach();
	var Types = require_types();
	var Utils = require_utils();
	var internals = { needsProtoHack: /* @__PURE__ */ new Set([
		Types.set,
		Types.map,
		Types.weakSet,
		Types.weakMap
	]) };
	module.exports = internals.clone = function(obj, options = {}, _seen = null) {
		if (typeof obj !== "object" || obj === null) return obj;
		let clone = internals.clone;
		let seen = _seen;
		if (options.shallow) {
			if (options.shallow !== true) return internals.cloneWithShallow(obj, options);
			clone = (value) => value;
		} else if (seen) {
			const lookup = seen.get(obj);
			if (lookup) return lookup;
		} else seen = /* @__PURE__ */ new Map();
		const baseProto = Types.getInternalProto(obj);
		if (baseProto === Types.buffer) return Buffer && Buffer.from(obj);
		if (baseProto === Types.date) return new Date(obj.getTime());
		if (baseProto === Types.regex) return new RegExp(obj);
		const newObj = internals.base(obj, baseProto, options);
		if (newObj === obj) return obj;
		if (seen) seen.set(obj, newObj);
		if (baseProto === Types.set) for (const value of obj) newObj.add(clone(value, options, seen));
		else if (baseProto === Types.map) for (const [key, value] of obj) newObj.set(key, clone(value, options, seen));
		const keys = Utils.keys(obj, options);
		for (const key of keys) {
			if (key === "__proto__") continue;
			if (baseProto === Types.array && key === "length") {
				newObj.length = obj.length;
				continue;
			}
			const descriptor = Object.getOwnPropertyDescriptor(obj, key);
			if (descriptor) {
				if (descriptor.get || descriptor.set) Object.defineProperty(newObj, key, descriptor);
				else if (descriptor.enumerable) newObj[key] = clone(obj[key], options, seen);
				else Object.defineProperty(newObj, key, {
					enumerable: false,
					writable: true,
					configurable: true,
					value: clone(obj[key], options, seen)
				});
			} else Object.defineProperty(newObj, key, {
				enumerable: true,
				writable: true,
				configurable: true,
				value: clone(obj[key], options, seen)
			});
		}
		return newObj;
	};
	internals.cloneWithShallow = function(source, options) {
		const keys = options.shallow;
		options = Object.assign({}, options);
		options.shallow = false;
		const seen = /* @__PURE__ */ new Map();
		for (const key of keys) {
			const ref = Reach(source, key);
			if (typeof ref === "object" || typeof ref === "function") seen.set(ref, ref);
		}
		return internals.clone(source, options, seen);
	};
	internals.base = function(obj, baseProto, options) {
		if (options.prototype === false) {
			if (internals.needsProtoHack.has(baseProto)) return new baseProto.constructor();
			return baseProto === Types.array ? [] : {};
		}
		const proto = Object.getPrototypeOf(obj);
		if (proto && proto.isImmutable) return obj;
		if (baseProto === Types.array) {
			const newObj = [];
			if (proto !== baseProto) Object.setPrototypeOf(newObj, proto);
			return newObj;
		}
		if (internals.needsProtoHack.has(baseProto)) {
			const newObj = new proto.constructor();
			if (proto !== baseProto) Object.setPrototypeOf(newObj, proto);
			return newObj;
		}
		return Object.create(proto);
	};
}));
//#endregion
//#region node_modules/@hapi/hoek/lib/merge.js
var require_merge = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Assert = require_assert();
	var Clone = require_clone();
	var Utils = require_utils();
	var internals = {};
	module.exports = internals.merge = function(target, source, options) {
		Assert(target && typeof target === "object", "Invalid target value: must be an object");
		Assert(source === null || source === void 0 || typeof source === "object", "Invalid source value: must be null, undefined, or an object");
		if (!source) return target;
		options = Object.assign({
			nullOverride: true,
			mergeArrays: true
		}, options);
		if (Array.isArray(source)) {
			Assert(Array.isArray(target), "Cannot merge array onto an object");
			if (!options.mergeArrays) target.length = 0;
			for (let i = 0; i < source.length; ++i) target.push(Clone(source[i], { symbols: options.symbols }));
			return target;
		}
		const keys = Utils.keys(source, options);
		for (let i = 0; i < keys.length; ++i) {
			const key = keys[i];
			if (key === "__proto__" || !Object.prototype.propertyIsEnumerable.call(source, key)) continue;
			const value = source[key];
			if (value && typeof value === "object") {
				if (target[key] === value) continue;
				if (!target[key] || typeof target[key] !== "object" || Array.isArray(target[key]) !== Array.isArray(value) || value instanceof Date || Buffer && Buffer.isBuffer(value) || value instanceof RegExp) target[key] = Clone(value, { symbols: options.symbols });
				else internals.merge(target[key], value, options);
			} else if (value !== null && value !== void 0) target[key] = value;
			else if (options.nullOverride) target[key] = value;
		}
		return target;
	};
}));
//#endregion
//#region node_modules/@hapi/hoek/lib/applyToDefaults.js
var require_applyToDefaults = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Assert = require_assert();
	var Clone = require_clone();
	var Merge = require_merge();
	var Reach = require_reach();
	var internals = {};
	module.exports = function(defaults, source, options = {}) {
		Assert(defaults && typeof defaults === "object", "Invalid defaults value: must be an object");
		Assert(!source || source === true || typeof source === "object", "Invalid source value: must be true, falsy or an object");
		Assert(typeof options === "object", "Invalid options: must be an object");
		if (!source) return null;
		if (options.shallow) return internals.applyToDefaultsWithShallow(defaults, source, options);
		const copy = Clone(defaults);
		if (source === true) return copy;
		return Merge(copy, source, {
			nullOverride: options.nullOverride !== void 0 ? options.nullOverride : false,
			mergeArrays: false
		});
	};
	internals.applyToDefaultsWithShallow = function(defaults, source, options) {
		const keys = options.shallow;
		Assert(Array.isArray(keys), "Invalid keys");
		const seen = /* @__PURE__ */ new Map();
		const merge = source === true ? null : /* @__PURE__ */ new Set();
		for (let key of keys) {
			key = Array.isArray(key) ? key : key.split(".");
			const ref = Reach(defaults, key);
			if (ref && typeof ref === "object") seen.set(ref, merge && Reach(source, key) || ref);
			else if (merge) merge.add(key);
		}
		const copy = Clone(defaults, {}, seen);
		if (!merge) return copy;
		for (const key of merge) internals.reachCopy(copy, source, key);
		return Merge(copy, source, {
			nullOverride: options.nullOverride !== void 0 ? options.nullOverride : false,
			mergeArrays: false
		});
	};
	internals.reachCopy = function(dst, src, path) {
		for (const segment of path) {
			if (!(segment in src)) return;
			const val = src[segment];
			if (typeof val !== "object" || val === null) return;
			src = val;
		}
		const value = src;
		let ref = dst;
		for (let i = 0; i < path.length - 1; ++i) {
			const segment = path[i];
			if (typeof ref[segment] !== "object") ref[segment] = {};
			ref = ref[segment];
		}
		ref[path[path.length - 1]] = value;
	};
}));
//#endregion
//#region node_modules/@hapi/hoek/lib/bench.js
var require_bench = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var internals = {};
	module.exports = internals.Bench = class {
		constructor() {
			this.ts = 0;
			this.reset();
		}
		reset() {
			this.ts = internals.Bench.now();
		}
		elapsed() {
			return internals.Bench.now() - this.ts;
		}
		static now() {
			const ts = process.hrtime();
			return ts[0] * 1e3 + ts[1] / 1e6;
		}
	};
}));
//#endregion
//#region node_modules/@hapi/hoek/lib/ignore.js
var require_ignore = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function() {};
}));
//#endregion
//#region node_modules/@hapi/hoek/lib/block.js
var require_block = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Ignore = require_ignore();
	module.exports = function() {
		return new Promise(Ignore);
	};
}));
//#endregion
//#region node_modules/@hapi/hoek/lib/deepEqual.js
var require_deepEqual = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Types = require_types();
	var internals = { mismatched: null };
	module.exports = function(obj, ref, options) {
		options = Object.assign({ prototype: true }, options);
		return !!internals.isDeepEqual(obj, ref, options, []);
	};
	internals.isDeepEqual = function(obj, ref, options, seen) {
		if (obj === ref) return obj !== 0 || 1 / obj === 1 / ref;
		const type = typeof obj;
		if (type !== typeof ref) return false;
		if (obj === null || ref === null) return false;
		if (type === "function") {
			if (!options.deepFunction || obj.toString() !== ref.toString()) return false;
		} else if (type !== "object") return obj !== obj && ref !== ref;
		const instanceType = internals.getSharedType(obj, ref, !!options.prototype);
		switch (instanceType) {
			case Types.buffer: return Buffer && Buffer.prototype.equals.call(obj, ref);
			case Types.promise: return obj === ref;
			case Types.regex: return obj.toString() === ref.toString();
			case internals.mismatched: return false;
		}
		for (let i = seen.length - 1; i >= 0; --i) if (seen[i].isSame(obj, ref)) return true;
		seen.push(new internals.SeenEntry(obj, ref));
		try {
			return !!internals.isDeepEqualObj(instanceType, obj, ref, options, seen);
		} finally {
			seen.pop();
		}
	};
	internals.getSharedType = function(obj, ref, checkPrototype) {
		if (checkPrototype) {
			if (Object.getPrototypeOf(obj) !== Object.getPrototypeOf(ref)) return internals.mismatched;
			return Types.getInternalProto(obj);
		}
		const type = Types.getInternalProto(obj);
		if (type !== Types.getInternalProto(ref)) return internals.mismatched;
		return type;
	};
	internals.valueOf = function(obj) {
		const objValueOf = obj.valueOf;
		if (objValueOf === void 0) return obj;
		try {
			return objValueOf.call(obj);
		} catch (err) {
			return err;
		}
	};
	internals.hasOwnEnumerableProperty = function(obj, key) {
		return Object.prototype.propertyIsEnumerable.call(obj, key);
	};
	internals.isSetSimpleEqual = function(obj, ref) {
		for (const entry of Set.prototype.values.call(obj)) if (!Set.prototype.has.call(ref, entry)) return false;
		return true;
	};
	internals.isDeepEqualObj = function(instanceType, obj, ref, options, seen) {
		const { isDeepEqual, valueOf, hasOwnEnumerableProperty } = internals;
		const { keys, getOwnPropertySymbols } = Object;
		if (instanceType === Types.array) {
			if (options.part) {
				for (const objValue of obj) for (const refValue of ref) if (isDeepEqual(objValue, refValue, options, seen)) return true;
			} else {
				if (obj.length !== ref.length) return false;
				for (let i = 0; i < obj.length; ++i) if (!isDeepEqual(obj[i], ref[i], options, seen)) return false;
				return true;
			}
		} else if (instanceType === Types.set) {
			if (obj.size !== ref.size) return false;
			if (!internals.isSetSimpleEqual(obj, ref)) {
				const ref2 = new Set(Set.prototype.values.call(ref));
				for (const objEntry of Set.prototype.values.call(obj)) {
					if (ref2.delete(objEntry)) continue;
					let found = false;
					for (const refEntry of ref2) if (isDeepEqual(objEntry, refEntry, options, seen)) {
						ref2.delete(refEntry);
						found = true;
						break;
					}
					if (!found) return false;
				}
			}
		} else if (instanceType === Types.map) {
			if (obj.size !== ref.size) return false;
			for (const [key, value] of Map.prototype.entries.call(obj)) {
				if (value === void 0 && !Map.prototype.has.call(ref, key)) return false;
				if (!isDeepEqual(value, Map.prototype.get.call(ref, key), options, seen)) return false;
			}
		} else if (instanceType === Types.error) {
			if (obj.name !== ref.name || obj.message !== ref.message) return false;
		}
		const valueOfObj = valueOf(obj);
		const valueOfRef = valueOf(ref);
		if ((obj !== valueOfObj || ref !== valueOfRef) && !isDeepEqual(valueOfObj, valueOfRef, options, seen)) return false;
		const objKeys = keys(obj);
		if (!options.part && objKeys.length !== keys(ref).length && !options.skip) return false;
		let skipped = 0;
		for (const key of objKeys) {
			if (options.skip && options.skip.includes(key)) {
				if (ref[key] === void 0) ++skipped;
				continue;
			}
			if (!hasOwnEnumerableProperty(ref, key)) return false;
			if (!isDeepEqual(obj[key], ref[key], options, seen)) return false;
		}
		if (!options.part && objKeys.length - skipped !== keys(ref).length) return false;
		if (options.symbols !== false) {
			const objSymbols = getOwnPropertySymbols(obj);
			const refSymbols = new Set(getOwnPropertySymbols(ref));
			for (const key of objSymbols) {
				if (!options.skip || !options.skip.includes(key)) {
					if (hasOwnEnumerableProperty(obj, key)) {
						if (!hasOwnEnumerableProperty(ref, key)) return false;
						if (!isDeepEqual(obj[key], ref[key], options, seen)) return false;
					} else if (hasOwnEnumerableProperty(ref, key)) return false;
				}
				refSymbols.delete(key);
			}
			for (const key of refSymbols) if (hasOwnEnumerableProperty(ref, key)) return false;
		}
		return true;
	};
	internals.SeenEntry = class {
		constructor(obj, ref) {
			this.obj = obj;
			this.ref = ref;
		}
		isSame(obj, ref) {
			return this.obj === obj && this.ref === ref;
		}
	};
}));
//#endregion
//#region node_modules/@hapi/hoek/lib/escapeRegex.js
var require_escapeRegex = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(string) {
		return string.replace(/[\^\$\.\*\+\-\?\=\!\:\|\\\/\(\)\[\]\{\}\,]/g, "\\$&");
	};
}));
//#endregion
//#region node_modules/@hapi/hoek/lib/contain.js
var require_contain = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Assert = require_assert();
	var DeepEqual = require_deepEqual();
	var EscapeRegex = require_escapeRegex();
	var Utils = require_utils();
	var internals = {};
	module.exports = function(ref, values, options = {}) {
		if (typeof values !== "object") values = [values];
		Assert(!Array.isArray(values) || values.length, "Values array cannot be empty");
		if (typeof ref === "string") return internals.string(ref, values, options);
		if (Array.isArray(ref)) return internals.array(ref, values, options);
		Assert(typeof ref === "object", "Reference must be string or an object");
		return internals.object(ref, values, options);
	};
	internals.array = function(ref, values, options) {
		if (!Array.isArray(values)) values = [values];
		if (!ref.length) return false;
		if (options.only && options.once && ref.length !== values.length) return false;
		let compare;
		const map = /* @__PURE__ */ new Map();
		for (const value of values) if (!options.deep || !value || typeof value !== "object") {
			const existing = map.get(value);
			if (existing) ++existing.allowed;
			else map.set(value, {
				allowed: 1,
				hits: 0
			});
		} else {
			compare = compare || internals.compare(options);
			let found = false;
			for (const [key, existing] of map.entries()) if (compare(key, value)) {
				++existing.allowed;
				found = true;
				break;
			}
			if (!found) map.set(value, {
				allowed: 1,
				hits: 0
			});
		}
		let hits = 0;
		for (const item of ref) {
			let match;
			if (!options.deep || !item || typeof item !== "object") match = map.get(item);
			else {
				compare = compare || internals.compare(options);
				for (const [key, existing] of map.entries()) if (compare(key, item)) {
					match = existing;
					break;
				}
			}
			if (match) {
				++match.hits;
				++hits;
				if (options.once && match.hits > match.allowed) return false;
			}
		}
		if (options.only && hits !== ref.length) return false;
		for (const match of map.values()) {
			if (match.hits === match.allowed) continue;
			if (match.hits < match.allowed && !options.part) return false;
		}
		return !!hits;
	};
	internals.object = function(ref, values, options) {
		Assert(options.once === void 0, "Cannot use option once with object");
		const keys = Utils.keys(ref, options);
		if (!keys.length) return false;
		if (Array.isArray(values)) return internals.array(keys, values, options);
		const symbols = Object.getOwnPropertySymbols(values).filter((sym) => values.propertyIsEnumerable(sym));
		const targets = [...Object.keys(values), ...symbols];
		const compare = internals.compare(options);
		const set = new Set(targets);
		for (const key of keys) {
			if (!set.has(key)) {
				if (options.only) return false;
				continue;
			}
			if (!compare(values[key], ref[key])) return false;
			set.delete(key);
		}
		if (set.size) return options.part ? set.size < targets.length : false;
		return true;
	};
	internals.string = function(ref, values, options) {
		if (ref === "") return values.length === 1 && values[0] === "" || !options.once && !values.some((v) => v !== "");
		const map = /* @__PURE__ */ new Map();
		const patterns = [];
		for (const value of values) {
			Assert(typeof value === "string", "Cannot compare string reference to non-string value");
			if (value) {
				const existing = map.get(value);
				if (existing) ++existing.allowed;
				else {
					map.set(value, {
						allowed: 1,
						hits: 0
					});
					patterns.push(EscapeRegex(value));
				}
			} else if (options.once || options.only) return false;
		}
		if (!patterns.length) return true;
		const regex = new RegExp(`(${patterns.join("|")})`, "g");
		const leftovers = ref.replace(regex, ($0, $1) => {
			++map.get($1).hits;
			return "";
		});
		if (options.only && leftovers) return false;
		let any = false;
		for (const match of map.values()) {
			if (match.hits) any = true;
			if (match.hits === match.allowed) continue;
			if (match.hits < match.allowed && !options.part) return false;
			if (options.once) return false;
		}
		return !!any;
	};
	internals.compare = function(options) {
		if (!options.deep) return internals.shallow;
		const hasOnly = options.only !== void 0;
		const hasPart = options.part !== void 0;
		const flags = {
			prototype: hasOnly ? options.only : hasPart ? !options.part : false,
			part: hasOnly ? !options.only : hasPart ? options.part : false
		};
		return (a, b) => DeepEqual(a, b, flags);
	};
	internals.shallow = function(a, b) {
		return a === b;
	};
}));
//#endregion
//#region node_modules/@hapi/hoek/lib/escapeHeaderAttribute.js
var require_escapeHeaderAttribute = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Assert = require_assert();
	module.exports = function(attribute) {
		Assert(/^[ \w\!#\$%&'\(\)\*\+,\-\.\/\:;<\=>\?@\[\]\^`\{\|\}~\"\\]*$/.test(attribute), "Bad attribute value (" + attribute + ")");
		return attribute.replace(/\\/g, "\\\\").replace(/\"/g, "\\\"");
	};
}));
//#endregion
//#region node_modules/@hapi/hoek/lib/escapeHtml.js
var require_escapeHtml = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var internals = {};
	module.exports = function(input) {
		if (!input) return "";
		let escaped = "";
		for (let i = 0; i < input.length; ++i) {
			const charCode = input.charCodeAt(i);
			if (internals.isSafe(charCode)) escaped += input[i];
			else escaped += internals.escapeHtmlChar(charCode);
		}
		return escaped;
	};
	internals.escapeHtmlChar = function(charCode) {
		const namedEscape = internals.namedHtml.get(charCode);
		if (namedEscape) return namedEscape;
		if (charCode >= 256) return "&#" + charCode + ";";
		return `&#x${charCode.toString(16).padStart(2, "0")};`;
	};
	internals.isSafe = function(charCode) {
		return internals.safeCharCodes.has(charCode);
	};
	internals.namedHtml = /* @__PURE__ */ new Map([
		[38, "&amp;"],
		[60, "&lt;"],
		[62, "&gt;"],
		[34, "&quot;"],
		[160, "&nbsp;"],
		[162, "&cent;"],
		[163, "&pound;"],
		[164, "&curren;"],
		[169, "&copy;"],
		[174, "&reg;"]
	]);
	internals.safeCharCodes = function() {
		const safe = /* @__PURE__ */ new Set();
		for (let i = 32; i < 123; ++i) if (i >= 97 || i >= 65 && i <= 90 || i >= 48 && i <= 57 || i === 32 || i === 46 || i === 44 || i === 45 || i === 58 || i === 95) safe.add(i);
		return safe;
	}();
}));
//#endregion
//#region node_modules/@hapi/hoek/lib/escapeJson.js
var require_escapeJson = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var internals = {};
	module.exports = function(input) {
		if (!input) return "";
		return input.replace(/[<>&\u2028\u2029]/g, internals.escape);
	};
	internals.escape = function(char) {
		return internals.replacements.get(char);
	};
	internals.replacements = /* @__PURE__ */ new Map([
		["<", "\\u003c"],
		[">", "\\u003e"],
		["&", "\\u0026"],
		["\u2028", "\\u2028"],
		["\u2029", "\\u2029"]
	]);
}));
//#endregion
//#region node_modules/@hapi/hoek/lib/flatten.js
var require_flatten = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var internals = {};
	module.exports = internals.flatten = function(array, target) {
		const result = target || [];
		for (const entry of array) if (Array.isArray(entry)) internals.flatten(entry, result);
		else result.push(entry);
		return result;
	};
}));
//#endregion
//#region node_modules/@hapi/hoek/lib/intersect.js
var require_intersect = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var internals = {};
	module.exports = function(array1, array2, options = {}) {
		if (!array1 || !array2) return options.first ? null : [];
		const common = [];
		const hash = Array.isArray(array1) ? new Set(array1) : array1;
		const found = /* @__PURE__ */ new Set();
		for (const value of array2) if (internals.has(hash, value) && !found.has(value)) {
			if (options.first) return value;
			common.push(value);
			found.add(value);
		}
		return options.first ? null : common;
	};
	internals.has = function(ref, key) {
		if (typeof ref.has === "function") return ref.has(key);
		return ref[key] !== void 0;
	};
}));
//#endregion
//#region node_modules/@hapi/hoek/lib/isPromise.js
var require_isPromise = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(promise) {
		return !!promise && typeof promise.then === "function";
	};
}));
//#endregion
//#region node_modules/@hapi/hoek/lib/once.js
var require_once = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var internals = { wrapped: Symbol("wrapped") };
	module.exports = function(method) {
		if (method[internals.wrapped]) return method;
		let once = false;
		const wrappedFn = function(...args) {
			if (!once) {
				once = true;
				method(...args);
			}
		};
		wrappedFn[internals.wrapped] = true;
		return wrappedFn;
	};
}));
//#endregion
//#region node_modules/@hapi/hoek/lib/reachTemplate.js
var require_reachTemplate = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Reach = require_reach();
	module.exports = function(obj, template, options) {
		return template.replace(/{([^{}]+)}/g, ($0, chain) => {
			const value = Reach(obj, chain, options);
			return value === void 0 || value === null ? "" : value;
		});
	};
}));
//#endregion
//#region node_modules/@hapi/hoek/lib/wait.js
var require_wait = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var internals = { maxTimer: 2 ** 31 - 1 };
	module.exports = function(timeout, returnValue, options) {
		if (typeof timeout === "bigint") timeout = Number(timeout);
		if (timeout >= Number.MAX_SAFE_INTEGER) timeout = Infinity;
		if (typeof timeout !== "number" && timeout !== void 0) throw new TypeError("Timeout must be a number or bigint");
		return new Promise((resolve) => {
			const _setTimeout = options ? options.setTimeout : setTimeout;
			const activate = () => {
				const time = Math.min(timeout, internals.maxTimer);
				timeout -= time;
				_setTimeout(() => timeout > 0 ? activate() : resolve(returnValue), time);
			};
			if (timeout !== Infinity) activate();
		});
	};
}));
//#endregion
//#region node_modules/@hapi/hoek/lib/index.js
var require_lib$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.applyToDefaults = require_applyToDefaults();
	exports.assert = require_assert();
	exports.Bench = require_bench();
	exports.block = require_block();
	exports.clone = require_clone();
	exports.contain = require_contain();
	exports.deepEqual = require_deepEqual();
	exports.Error = require_error();
	exports.escapeHeaderAttribute = require_escapeHeaderAttribute();
	exports.escapeHtml = require_escapeHtml();
	exports.escapeJson = require_escapeJson();
	exports.escapeRegex = require_escapeRegex();
	exports.flatten = require_flatten();
	exports.ignore = require_ignore();
	exports.intersect = require_intersect();
	exports.isPromise = require_isPromise();
	exports.merge = require_merge();
	exports.once = require_once();
	exports.reach = require_reach();
	exports.reachTemplate = require_reachTemplate();
	exports.stringify = require_stringify();
	exports.wait = require_wait();
}));
//#endregion
//#region node_modules/@hapi/boom/lib/index.js
var require_lib = /* @__PURE__ */ __commonJSMin(((exports) => {
	var Hoek = require_lib$1();
	var internals = { codes: /* @__PURE__ */ new Map([
		[100, "Continue"],
		[101, "Switching Protocols"],
		[102, "Processing"],
		[200, "OK"],
		[201, "Created"],
		[202, "Accepted"],
		[203, "Non-Authoritative Information"],
		[204, "No Content"],
		[205, "Reset Content"],
		[206, "Partial Content"],
		[207, "Multi-Status"],
		[300, "Multiple Choices"],
		[301, "Moved Permanently"],
		[302, "Moved Temporarily"],
		[303, "See Other"],
		[304, "Not Modified"],
		[305, "Use Proxy"],
		[307, "Temporary Redirect"],
		[400, "Bad Request"],
		[401, "Unauthorized"],
		[402, "Payment Required"],
		[403, "Forbidden"],
		[404, "Not Found"],
		[405, "Method Not Allowed"],
		[406, "Not Acceptable"],
		[407, "Proxy Authentication Required"],
		[408, "Request Time-out"],
		[409, "Conflict"],
		[410, "Gone"],
		[411, "Length Required"],
		[412, "Precondition Failed"],
		[413, "Request Entity Too Large"],
		[414, "Request-URI Too Large"],
		[415, "Unsupported Media Type"],
		[416, "Requested Range Not Satisfiable"],
		[417, "Expectation Failed"],
		[418, "I'm a teapot"],
		[422, "Unprocessable Entity"],
		[423, "Locked"],
		[424, "Failed Dependency"],
		[425, "Too Early"],
		[426, "Upgrade Required"],
		[428, "Precondition Required"],
		[429, "Too Many Requests"],
		[431, "Request Header Fields Too Large"],
		[451, "Unavailable For Legal Reasons"],
		[500, "Internal Server Error"],
		[501, "Not Implemented"],
		[502, "Bad Gateway"],
		[503, "Service Unavailable"],
		[504, "Gateway Time-out"],
		[505, "HTTP Version Not Supported"],
		[506, "Variant Also Negotiates"],
		[507, "Insufficient Storage"],
		[509, "Bandwidth Limit Exceeded"],
		[510, "Not Extended"],
		[511, "Network Authentication Required"]
	]) };
	exports.Boom = class extends Error {
		constructor(message, options = {}) {
			if (message instanceof Error) return exports.boomify(Hoek.clone(message), options);
			const { statusCode = 500, data = null, ctor = exports.Boom } = options;
			const error = new Error(message ? message : void 0);
			Error.captureStackTrace(error, ctor);
			error.data = data;
			const boom = internals.initialize(error, statusCode);
			Object.defineProperty(boom, "typeof", { value: ctor });
			if (options.decorate) Object.assign(boom, options.decorate);
			return boom;
		}
		static [Symbol.hasInstance](instance) {
			if (this === exports.Boom) return exports.isBoom(instance);
			return this.prototype.isPrototypeOf(instance);
		}
	};
	exports.isBoom = function(err, statusCode) {
		return err instanceof Error && !!err.isBoom && (!statusCode || err.output.statusCode === statusCode);
	};
	exports.boomify = function(err, options) {
		Hoek.assert(err instanceof Error, "Cannot wrap non-Error object");
		options = options || {};
		if (options.data !== void 0) err.data = options.data;
		if (options.decorate) Object.assign(err, options.decorate);
		if (!err.isBoom) return internals.initialize(err, options.statusCode || 500, options.message);
		if (options.override === false || !options.statusCode && !options.message) return err;
		return internals.initialize(err, options.statusCode || err.output.statusCode, options.message);
	};
	exports.badRequest = function(message, data) {
		return new exports.Boom(message, {
			statusCode: 400,
			data,
			ctor: exports.badRequest
		});
	};
	exports.unauthorized = function(message, scheme, attributes) {
		const err = new exports.Boom(message, {
			statusCode: 401,
			ctor: exports.unauthorized
		});
		if (!scheme) return err;
		if (typeof scheme !== "string") {
			err.output.headers["WWW-Authenticate"] = scheme.join(", ");
			return err;
		}
		let wwwAuthenticate = `${scheme}`;
		if (attributes || message) err.output.payload.attributes = {};
		if (attributes) {
			if (typeof attributes === "string") {
				wwwAuthenticate += " " + Hoek.escapeHeaderAttribute(attributes);
				err.output.payload.attributes = attributes;
			} else wwwAuthenticate += " " + Object.keys(attributes).map((name) => {
				let value = attributes[name];
				if (value === null || value === void 0) value = "";
				err.output.payload.attributes[name] = value;
				return `${name}="${Hoek.escapeHeaderAttribute(value.toString())}"`;
			}).join(", ");
		}
		if (message) {
			if (attributes) wwwAuthenticate += ",";
			wwwAuthenticate += ` error="${Hoek.escapeHeaderAttribute(message)}"`;
			err.output.payload.attributes.error = message;
		} else err.isMissing = true;
		err.output.headers["WWW-Authenticate"] = wwwAuthenticate;
		return err;
	};
	exports.paymentRequired = function(message, data) {
		return new exports.Boom(message, {
			statusCode: 402,
			data,
			ctor: exports.paymentRequired
		});
	};
	exports.forbidden = function(message, data) {
		return new exports.Boom(message, {
			statusCode: 403,
			data,
			ctor: exports.forbidden
		});
	};
	exports.notFound = function(message, data) {
		return new exports.Boom(message, {
			statusCode: 404,
			data,
			ctor: exports.notFound
		});
	};
	exports.methodNotAllowed = function(message, data, allow) {
		const err = new exports.Boom(message, {
			statusCode: 405,
			data,
			ctor: exports.methodNotAllowed
		});
		if (typeof allow === "string") allow = [allow];
		if (Array.isArray(allow)) err.output.headers.Allow = allow.join(", ");
		return err;
	};
	exports.notAcceptable = function(message, data) {
		return new exports.Boom(message, {
			statusCode: 406,
			data,
			ctor: exports.notAcceptable
		});
	};
	exports.proxyAuthRequired = function(message, data) {
		return new exports.Boom(message, {
			statusCode: 407,
			data,
			ctor: exports.proxyAuthRequired
		});
	};
	exports.clientTimeout = function(message, data) {
		return new exports.Boom(message, {
			statusCode: 408,
			data,
			ctor: exports.clientTimeout
		});
	};
	exports.conflict = function(message, data) {
		return new exports.Boom(message, {
			statusCode: 409,
			data,
			ctor: exports.conflict
		});
	};
	exports.resourceGone = function(message, data) {
		return new exports.Boom(message, {
			statusCode: 410,
			data,
			ctor: exports.resourceGone
		});
	};
	exports.lengthRequired = function(message, data) {
		return new exports.Boom(message, {
			statusCode: 411,
			data,
			ctor: exports.lengthRequired
		});
	};
	exports.preconditionFailed = function(message, data) {
		return new exports.Boom(message, {
			statusCode: 412,
			data,
			ctor: exports.preconditionFailed
		});
	};
	exports.entityTooLarge = function(message, data) {
		return new exports.Boom(message, {
			statusCode: 413,
			data,
			ctor: exports.entityTooLarge
		});
	};
	exports.uriTooLong = function(message, data) {
		return new exports.Boom(message, {
			statusCode: 414,
			data,
			ctor: exports.uriTooLong
		});
	};
	exports.unsupportedMediaType = function(message, data) {
		return new exports.Boom(message, {
			statusCode: 415,
			data,
			ctor: exports.unsupportedMediaType
		});
	};
	exports.rangeNotSatisfiable = function(message, data) {
		return new exports.Boom(message, {
			statusCode: 416,
			data,
			ctor: exports.rangeNotSatisfiable
		});
	};
	exports.expectationFailed = function(message, data) {
		return new exports.Boom(message, {
			statusCode: 417,
			data,
			ctor: exports.expectationFailed
		});
	};
	exports.teapot = function(message, data) {
		return new exports.Boom(message, {
			statusCode: 418,
			data,
			ctor: exports.teapot
		});
	};
	exports.badData = function(message, data) {
		return new exports.Boom(message, {
			statusCode: 422,
			data,
			ctor: exports.badData
		});
	};
	exports.locked = function(message, data) {
		return new exports.Boom(message, {
			statusCode: 423,
			data,
			ctor: exports.locked
		});
	};
	exports.failedDependency = function(message, data) {
		return new exports.Boom(message, {
			statusCode: 424,
			data,
			ctor: exports.failedDependency
		});
	};
	exports.tooEarly = function(message, data) {
		return new exports.Boom(message, {
			statusCode: 425,
			data,
			ctor: exports.tooEarly
		});
	};
	exports.preconditionRequired = function(message, data) {
		return new exports.Boom(message, {
			statusCode: 428,
			data,
			ctor: exports.preconditionRequired
		});
	};
	exports.tooManyRequests = function(message, data) {
		return new exports.Boom(message, {
			statusCode: 429,
			data,
			ctor: exports.tooManyRequests
		});
	};
	exports.illegal = function(message, data) {
		return new exports.Boom(message, {
			statusCode: 451,
			data,
			ctor: exports.illegal
		});
	};
	exports.internal = function(message, data, statusCode = 500) {
		return internals.serverError(message, data, statusCode, exports.internal);
	};
	exports.notImplemented = function(message, data) {
		return internals.serverError(message, data, 501, exports.notImplemented);
	};
	exports.badGateway = function(message, data) {
		return internals.serverError(message, data, 502, exports.badGateway);
	};
	exports.serverUnavailable = function(message, data) {
		return internals.serverError(message, data, 503, exports.serverUnavailable);
	};
	exports.gatewayTimeout = function(message, data) {
		return internals.serverError(message, data, 504, exports.gatewayTimeout);
	};
	exports.badImplementation = function(message, data) {
		const err = internals.serverError(message, data, 500, exports.badImplementation);
		err.isDeveloperError = true;
		return err;
	};
	internals.initialize = function(err, statusCode, message) {
		const numberCode = parseInt(statusCode, 10);
		Hoek.assert(!isNaN(numberCode) && numberCode >= 400, "First argument must be a number (400+):", statusCode);
		err.isBoom = true;
		err.isServer = numberCode >= 500;
		if (!err.hasOwnProperty("data")) err.data = null;
		err.output = {
			statusCode: numberCode,
			payload: {},
			headers: {}
		};
		Object.defineProperty(err, "reformat", {
			value: internals.reformat,
			configurable: true
		});
		if (!message && !err.message) {
			err.reformat();
			message = err.output.payload.error;
		}
		if (message) {
			const props = Object.getOwnPropertyDescriptor(err, "message") || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(err), "message");
			Hoek.assert(!props || props.configurable && !props.get, "The error is not compatible with boom");
			err.message = message + (err.message ? ": " + err.message : "");
			err.output.payload.message = err.message;
		}
		err.reformat();
		return err;
	};
	internals.reformat = function(debug = false) {
		this.output.payload.statusCode = this.output.statusCode;
		this.output.payload.error = internals.codes.get(this.output.statusCode) || "Unknown";
		if (this.output.statusCode === 500 && debug !== true) this.output.payload.message = "An internal server error occurred";
		else if (this.message) this.output.payload.message = this.message;
	};
	internals.serverError = function(message, data, statusCode, ctor) {
		if (data instanceof Error && !data.isBoom) return exports.boomify(data, {
			statusCode,
			message
		});
		return new exports.Boom(message, {
			statusCode,
			data,
			ctor
		});
	};
}));
//#endregion
export { require_lib as t };
