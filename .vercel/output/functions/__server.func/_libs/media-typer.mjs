//#region node_modules/media-typer/dist/index.js
var typeRegExp = /^[A-Za-z0-9][A-Za-z0-9!#$&^_-]{0,126}\/[A-Za-z0-9][A-Za-z0-9!#$&^_.+-]{0,126}$/;
/**
* Parse media type to object.
*/
function parse(str) {
	if (!typeRegExp.test(str)) throw new TypeError(`Invalid media type: ${str}`);
	const slashIndex = str.indexOf("/");
	const type = str.slice(0, slashIndex).toLowerCase();
	let subtype = str.slice(slashIndex + 1).toLowerCase();
	let suffix;
	const index = subtype.lastIndexOf("+");
	if (index !== -1) {
		suffix = subtype.slice(index + 1);
		subtype = subtype.slice(0, index);
	}
	return {
		type,
		subtype,
		suffix
	};
}
//#endregion
export { parse as t };
