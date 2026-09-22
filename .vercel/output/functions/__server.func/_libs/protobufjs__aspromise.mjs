import { t as __commonJSMin } from "../_runtime.mjs";
//#region node_modules/@protobufjs/aspromise/index.js
var require_aspromise = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = asPromise;
	/**
	* Callback as used by {@link util.asPromise}.
	* @typedef asPromiseCallback
	* @type {function}
	* @param {Error|null} error Error, if any
	* @param {...*} params Additional arguments
	* @returns {undefined}
	*/
	/**
	* Returns a promise from a node-style callback function.
	* @memberof util
	* @param {asPromiseCallback} fn Function to call
	* @param {*} ctx Function context
	* @param {...*} params Function arguments
	* @returns {Promise<*>} Promisified function
	*/
	function asPromise(fn, ctx) {
		var params = new Array(arguments.length - 1), offset = 0, index = 2, pending = true;
		while (index < arguments.length) params[offset++] = arguments[index++];
		return new Promise(function executor(resolve, reject) {
			params[offset] = function callback(err) {
				if (pending) {
					pending = false;
					if (err) reject(err);
					else {
						var params = new Array(arguments.length - 1), offset = 0;
						while (offset < params.length) params[offset++] = arguments[offset];
						resolve.apply(null, params);
					}
				}
			};
			try {
				fn.apply(ctx || null, params);
			} catch (err) {
				if (pending) {
					pending = false;
					reject(err);
				}
			}
		});
	}
}));
//#endregion
export { require_aspromise as t };
