//#region node_modules/@borewit/text-codec/lib/index.js
var WINDOWS_1252_EXTRA = {
	128: "€",
	130: "‚",
	131: "ƒ",
	132: "„",
	133: "…",
	134: "†",
	135: "‡",
	136: "ˆ",
	137: "‰",
	138: "Š",
	139: "‹",
	140: "Œ",
	142: "Ž",
	145: "‘",
	146: "’",
	147: "“",
	148: "”",
	149: "•",
	150: "–",
	151: "—",
	152: "˜",
	153: "™",
	154: "š",
	155: "›",
	156: "œ",
	158: "ž",
	159: "Ÿ"
};
var WINDOWS_1252_REVERSE = {};
for (const [code, char] of Object.entries(WINDOWS_1252_EXTRA)) WINDOWS_1252_REVERSE[char] = Number.parseInt(code, 10);
var _utf8Decoder;
var _utf8Encoder;
function utf8Decoder() {
	if (typeof globalThis.TextDecoder === "undefined") return void 0;
	return _utf8Decoder !== null && _utf8Decoder !== void 0 ? _utf8Decoder : _utf8Decoder = new globalThis.TextDecoder("utf-8");
}
function utf8Encoder() {
	if (typeof globalThis.TextEncoder === "undefined") return void 0;
	return _utf8Encoder !== null && _utf8Encoder !== void 0 ? _utf8Encoder : _utf8Encoder = new globalThis.TextEncoder();
}
var CHUNK = 32768;
var REPLACEMENT = 65533;
/**
* Decode text from binary data
*/
function textDecode(bytes, encoding = "utf-8") {
	switch (encoding.toLowerCase()) {
		case "utf-8":
		case "utf8": {
			const dec = utf8Decoder();
			return dec ? dec.decode(bytes) : decodeUTF8(bytes);
		}
		case "utf-16le": return decodeUTF16LE(bytes);
		case "us-ascii":
		case "ascii": return decodeASCII(bytes);
		case "latin1":
		case "iso-8859-1": return decodeLatin1(bytes);
		case "windows-1252": return decodeWindows1252(bytes);
		default: throw new RangeError(`Encoding '${encoding}' not supported`);
	}
}
function textEncode(input = "", encoding = "utf-8") {
	switch (encoding.toLowerCase()) {
		case "utf-8":
		case "utf8": {
			const enc = utf8Encoder();
			return enc ? enc.encode(input) : encodeUTF8(input);
		}
		case "utf-16le": return encodeUTF16LE(input);
		case "us-ascii":
		case "ascii": return encodeASCII(input);
		case "latin1":
		case "iso-8859-1": return encodeLatin1(input);
		case "windows-1252": return encodeWindows1252(input);
		default: throw new RangeError(`Encoding '${encoding}' not supported`);
	}
}
function flushChunk(parts, chunk) {
	if (chunk.length === 0) return;
	parts.push(String.fromCharCode.apply(null, chunk));
	chunk.length = 0;
}
function pushCodeUnit(parts, chunk, codeUnit) {
	chunk.push(codeUnit);
	if (chunk.length >= CHUNK) flushChunk(parts, chunk);
}
function pushCodePoint(parts, chunk, cp) {
	if (cp <= 65535) {
		pushCodeUnit(parts, chunk, cp);
		return;
	}
	cp -= 65536;
	pushCodeUnit(parts, chunk, 55296 + (cp >> 10));
	pushCodeUnit(parts, chunk, 56320 + (cp & 1023));
}
function decodeUTF8(bytes) {
	const parts = [];
	const chunk = [];
	let i = 0;
	if (bytes.length >= 3 && bytes[0] === 239 && bytes[1] === 187 && bytes[2] === 191) i = 3;
	while (i < bytes.length) {
		const b1 = bytes[i];
		if (b1 <= 127) {
			pushCodeUnit(parts, chunk, b1);
			i++;
			continue;
		}
		if (b1 < 194 || b1 > 244) {
			pushCodeUnit(parts, chunk, REPLACEMENT);
			i++;
			continue;
		}
		if (b1 <= 223) {
			if (i + 1 >= bytes.length) {
				pushCodeUnit(parts, chunk, REPLACEMENT);
				i++;
				continue;
			}
			const b2 = bytes[i + 1];
			if ((b2 & 192) !== 128) {
				pushCodeUnit(parts, chunk, REPLACEMENT);
				i++;
				continue;
			}
			pushCodeUnit(parts, chunk, (b1 & 31) << 6 | b2 & 63);
			i += 2;
			continue;
		}
		if (b1 <= 239) {
			if (i + 2 >= bytes.length) {
				pushCodeUnit(parts, chunk, REPLACEMENT);
				i++;
				continue;
			}
			const b2 = bytes[i + 1];
			const b3 = bytes[i + 2];
			if (!((b2 & 192) === 128 && (b3 & 192) === 128 && !(b1 === 224 && b2 < 160) && !(b1 === 237 && b2 >= 160))) {
				pushCodeUnit(parts, chunk, REPLACEMENT);
				i++;
				continue;
			}
			pushCodeUnit(parts, chunk, (b1 & 15) << 12 | (b2 & 63) << 6 | b3 & 63);
			i += 3;
			continue;
		}
		if (i + 3 >= bytes.length) {
			pushCodeUnit(parts, chunk, REPLACEMENT);
			i++;
			continue;
		}
		const b2 = bytes[i + 1];
		const b3 = bytes[i + 2];
		const b4 = bytes[i + 3];
		if (!((b2 & 192) === 128 && (b3 & 192) === 128 && (b4 & 192) === 128 && !(b1 === 240 && b2 < 144) && !(b1 === 244 && b2 > 143))) {
			pushCodeUnit(parts, chunk, REPLACEMENT);
			i++;
			continue;
		}
		pushCodePoint(parts, chunk, (b1 & 7) << 18 | (b2 & 63) << 12 | (b3 & 63) << 6 | b4 & 63);
		i += 4;
	}
	flushChunk(parts, chunk);
	return parts.join("");
}
function decodeUTF16LE(bytes) {
	const parts = [];
	const chunk = [];
	const len = bytes.length;
	let i = 0;
	while (i + 1 < len) {
		const u1 = bytes[i] | bytes[i + 1] << 8;
		i += 2;
		if (u1 >= 55296 && u1 <= 56319) {
			if (i + 1 < len) {
				const u2 = bytes[i] | bytes[i + 1] << 8;
				if (u2 >= 56320 && u2 <= 57343) {
					pushCodeUnit(parts, chunk, u1);
					pushCodeUnit(parts, chunk, u2);
					i += 2;
				} else pushCodeUnit(parts, chunk, REPLACEMENT);
			} else pushCodeUnit(parts, chunk, REPLACEMENT);
			continue;
		}
		if (u1 >= 56320 && u1 <= 57343) {
			pushCodeUnit(parts, chunk, REPLACEMENT);
			continue;
		}
		pushCodeUnit(parts, chunk, u1);
	}
	if (i < len) pushCodeUnit(parts, chunk, REPLACEMENT);
	flushChunk(parts, chunk);
	return parts.join("");
}
function decodeASCII(bytes) {
	const parts = [];
	for (let i = 0; i < bytes.length; i += CHUNK) {
		const end = Math.min(bytes.length, i + CHUNK);
		const codes = new Array(end - i);
		for (let j = i, k = 0; j < end; j++, k++) codes[k] = bytes[j] & 127;
		parts.push(String.fromCharCode.apply(null, codes));
	}
	return parts.join("");
}
function decodeLatin1(bytes) {
	const parts = [];
	for (let i = 0; i < bytes.length; i += CHUNK) {
		const end = Math.min(bytes.length, i + CHUNK);
		const codes = new Array(end - i);
		for (let j = i, k = 0; j < end; j++, k++) codes[k] = bytes[j];
		parts.push(String.fromCharCode.apply(null, codes));
	}
	return parts.join("");
}
function decodeWindows1252(bytes) {
	const parts = [];
	let out = "";
	for (let i = 0; i < bytes.length; i++) {
		const b = bytes[i];
		const extra = b >= 128 && b <= 159 ? WINDOWS_1252_EXTRA[b] : void 0;
		out += extra !== null && extra !== void 0 ? extra : String.fromCharCode(b);
		if (out.length >= CHUNK) {
			parts.push(out);
			out = "";
		}
	}
	if (out) parts.push(out);
	return parts.join("");
}
function encodeUTF8(str) {
	const out = [];
	for (let i = 0; i < str.length; i++) {
		let cp = str.charCodeAt(i);
		if (cp >= 55296 && cp <= 56319) {
			if (i + 1 < str.length) {
				const lo = str.charCodeAt(i + 1);
				if (lo >= 56320 && lo <= 57343) {
					cp = 65536 + (cp - 55296 << 10) + (lo - 56320);
					i++;
				} else cp = REPLACEMENT;
			} else cp = REPLACEMENT;
		} else if (cp >= 56320 && cp <= 57343) cp = REPLACEMENT;
		if (cp < 128) out.push(cp);
		else if (cp < 2048) out.push(192 | cp >> 6, 128 | cp & 63);
		else if (cp < 65536) out.push(224 | cp >> 12, 128 | cp >> 6 & 63, 128 | cp & 63);
		else out.push(240 | cp >> 18, 128 | cp >> 12 & 63, 128 | cp >> 6 & 63, 128 | cp & 63);
	}
	return new Uint8Array(out);
}
function encodeUTF16LE(str) {
	const units = [];
	for (let i = 0; i < str.length; i++) {
		const u = str.charCodeAt(i);
		if (u >= 55296 && u <= 56319) {
			if (i + 1 < str.length) {
				const lo = str.charCodeAt(i + 1);
				if (lo >= 56320 && lo <= 57343) {
					units.push(u, lo);
					i++;
				} else units.push(REPLACEMENT);
			} else units.push(REPLACEMENT);
			continue;
		}
		if (u >= 56320 && u <= 57343) {
			units.push(REPLACEMENT);
			continue;
		}
		units.push(u);
	}
	const out = new Uint8Array(units.length * 2);
	for (let i = 0; i < units.length; i++) {
		const code = units[i];
		const o = i * 2;
		out[o] = code & 255;
		out[o + 1] = code >>> 8;
	}
	return out;
}
function encodeASCII(str) {
	const out = new Uint8Array(str.length);
	for (let i = 0; i < str.length; i++) out[i] = str.charCodeAt(i) & 127;
	return out;
}
function encodeLatin1(str) {
	const out = new Uint8Array(str.length);
	for (let i = 0; i < str.length; i++) out[i] = str.charCodeAt(i) & 255;
	return out;
}
function encodeWindows1252(str) {
	const out = new Uint8Array(str.length);
	for (let i = 0; i < str.length; i++) {
		const ch = str[i];
		const code = ch.charCodeAt(0);
		if (WINDOWS_1252_REVERSE[ch] !== void 0) {
			out[i] = WINDOWS_1252_REVERSE[ch];
			continue;
		}
		if (code >= 0 && code <= 127 || code >= 160 && code <= 255) {
			out[i] = code;
			continue;
		}
		out[i] = 63;
	}
	return out;
}
//#endregion
export { textEncode as n, textDecode as t };
