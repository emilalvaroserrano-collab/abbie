import { t as __commonJSMin } from "../_runtime.mjs";
//#region node_modules/content-type/dist/index.js
var require_dist = /* @__PURE__ */ __commonJSMin(((exports) => {
	/*!
	* content-type
	* Copyright(c) 2015 Douglas Christopher Wilson
	* MIT Licensed
	*/
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.parse = parse;
	/**
	* Null object perf optimization. Faster than `Object.create(null)` and `{ __proto__: null }`.
	*/
	var NullObject = /* @__PURE__ */ (() => {
		const C = function() {};
		C.prototype = Object.create(null);
		return C;
	})();
	/**
	* Parse a `Content-Type` header.
	*/
	function parse(header, options) {
		const stopChar = options?.comma === true ? COMMA : 65536;
		const len = header.length;
		let index = skipOWS(header, options?.start ?? 0, len);
		const valueStart = index;
		index = skipValue(header, index, len, stopChar);
		const valueEnd = trailingOWS(header, valueStart, index);
		const type = header.slice(valueStart, valueEnd).toLowerCase();
		if (options?.parameters === false) return {
			type,
			index,
			parameters: new NullObject()
		};
		return parseParameters(header, type, index, len, stopChar);
	}
	var SP = 32;
	var HTAB = 9;
	var SEMI = 59;
	var EQ = 61;
	var DQUOTE = 34;
	var BSLASH = 92;
	var COMMA = 44;
	/**
	* Parses the parameters of a `Content-Type` header starting at the given index.
	*/
	function parseParameters(header, type, index, len, stopChar) {
		const parameters = new NullObject();
		parameter: while (index < len) {
			if (header.charCodeAt(index) === stopChar) break;
			index = skipOWS(header, index + 1, len);
			const keyStart = index;
			while (index < len) {
				const code = header.charCodeAt(index);
				if (code === stopChar) break parameter;
				if (code === SEMI) continue parameter;
				if (code === EQ) {
					const keyEnd = trailingOWS(header, keyStart, index);
					const key = header.slice(keyStart, keyEnd).toLowerCase();
					index = skipOWS(header, index + 1, len);
					if (index < len && header.charCodeAt(index) === DQUOTE) {
						index++;
						let value = "";
						while (index < len) {
							const code = header.charCodeAt(index++);
							if (code === DQUOTE) {
								index = skipValue(header, index, len, stopChar);
								if (parameters[key] === void 0) parameters[key] = value;
								break;
							}
							if (code === BSLASH && index < len) {
								value += header[index++];
								continue;
							}
							value += String.fromCharCode(code);
						}
						continue parameter;
					}
					const valueStart = index;
					index = skipValue(header, index, len, stopChar);
					if (parameters[key] === void 0) {
						const valueEnd = trailingOWS(header, valueStart, index);
						parameters[key] = header.slice(valueStart, valueEnd);
					}
					continue parameter;
				}
				index++;
			}
		}
		return {
			type,
			index,
			parameters
		};
	}
	/**
	* Skip over characters until a semicolon or other exit character.
	*/
	function skipValue(str, index, len, stopChar) {
		while (index < len) {
			const code = str.charCodeAt(index);
			if (code === SEMI || code === stopChar) break;
			index++;
		}
		return index;
	}
	/**
	* Skip optional whitespace (OWS) in an HTTP header value.
	*
	* OWS is defined in RFC 9110 sec 5.6.3 as SP (" ") or HTAB ("\t").
	*/
	function skipOWS(header, index, len) {
		while (index < len) {
			const char = header.charCodeAt(index);
			if (char !== SP && char !== HTAB) break;
			index++;
		}
		return index;
	}
	/**
	* Trim optional whitespace (OWS) from the end of a substring.
	*
	* OWS is defined in RFC 9110 sec 5.6.3 as SP (" ") or HTAB ("\t").
	*/
	function trailingOWS(header, start, end) {
		while (end > start) {
			const char = header.charCodeAt(end - 1);
			if (char !== SP && char !== HTAB) break;
			end--;
		}
		return end;
	}
}));
//#endregion
export { require_dist as t };
