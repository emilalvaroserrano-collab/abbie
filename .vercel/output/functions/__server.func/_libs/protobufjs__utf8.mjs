import { t as __commonJSMin } from "../_runtime.mjs";
//#region node_modules/@protobufjs/utf8/index.js
var require_utf8 = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* A minimal UTF8 implementation for number arrays.
	* @memberof util
	* @namespace
	*/
	var utf8 = exports;
	var replacementCharCode = 65533;
	/**
	* Calculates the UTF8 byte length of a string.
	* @param {string} string String
	* @returns {number} Byte length
	*/
	utf8.length = function utf8_length(string) {
		var len = 0, c = 0;
		for (var i = 0; i < string.length; ++i) {
			c = string.charCodeAt(i);
			if (c < 128) len += 1;
			else if (c < 2048) len += 2;
			else if ((c & 64512) === 55296 && (string.charCodeAt(i + 1) & 64512) === 56320) {
				++i;
				len += 4;
			} else len += 3;
		}
		return len;
	};
	/**
	* Reads UTF8 bytes as a string.
	* @param {Uint8Array} buffer Source buffer
	* @param {number} start Source start
	* @param {number} end Source end
	* @returns {string} String read
	*/
	utf8.read = function utf8_read(buffer, start, end) {
		if (end - start < 1) return "";
		var parts = null, chunk = [], i = 0, t, t2, c2, c3;
		while (start < end) {
			t = buffer[start++];
			if (t <= 127) chunk[i++] = t;
			else if (t >= 192 && t < 224) {
				c2 = (t & 31) << 6 | buffer[start++] & 63;
				chunk[i++] = c2 >= 128 ? c2 : replacementCharCode;
			} else if (t >= 224 && t < 240) {
				c3 = (t & 15) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63;
				chunk[i++] = c3 >= 2048 ? c3 : replacementCharCode;
			} else if (t >= 240) {
				t2 = (t & 7) << 18 | (buffer[start++] & 63) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63;
				if (t2 < 65536 || t2 > 1114111) chunk[i++] = replacementCharCode;
				else {
					t2 -= 65536;
					chunk[i++] = 55296 + (t2 >> 10);
					chunk[i++] = 56320 + (t2 & 1023);
				}
			}
			if (i > 8191) {
				(parts || (parts = [])).push(String.fromCharCode.apply(String, chunk.slice(0, i)));
				i = 0;
			}
		}
		if (parts) {
			if (i) parts.push(String.fromCharCode.apply(String, chunk.slice(0, i)));
			return parts.join("");
		}
		return String.fromCharCode.apply(String, chunk.slice(0, i));
	};
	/**
	* Writes a string as UTF8 bytes.
	* @param {string} string Source string
	* @param {Uint8Array} buffer Destination buffer
	* @param {number} offset Destination offset
	* @returns {number} Bytes written
	*/
	utf8.write = function utf8_write(string, buffer, offset) {
		var start = offset, c1, c2;
		for (var i = 0; i < string.length; ++i) {
			c1 = string.charCodeAt(i);
			if (c1 < 128) buffer[offset++] = c1;
			else if (c1 < 2048) {
				buffer[offset++] = c1 >> 6 | 192;
				buffer[offset++] = c1 & 63 | 128;
			} else if ((c1 & 64512) === 55296 && ((c2 = string.charCodeAt(i + 1)) & 64512) === 56320) {
				c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
				++i;
				buffer[offset++] = c1 >> 18 | 240;
				buffer[offset++] = c1 >> 12 & 63 | 128;
				buffer[offset++] = c1 >> 6 & 63 | 128;
				buffer[offset++] = c1 & 63 | 128;
			} else {
				buffer[offset++] = c1 >> 12 | 224;
				buffer[offset++] = c1 >> 6 & 63 | 128;
				buffer[offset++] = c1 & 63 | 128;
			}
		}
		return offset - start;
	};
}));
//#endregion
export { require_utf8 as t };
