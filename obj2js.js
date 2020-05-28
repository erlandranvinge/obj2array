const fs = require('fs');
const args = process.argv.slice(2);

if (!args.length) {
	console.log('usage: node obj2js <input.obj> <output.js>')
	process.exit(0);
}

const inPath = args[0];
const outPath = args.length >= 2 ? args[1] : 'out.js';

const file = fs.readFileSync(inPath);
let offset = 0;
let output = [];

while (offset < file.length) {
	const type = file.readUInt8(offset++);
	const length =  file.readUInt16LE(offset);
	offset += 2;
	if (type === 0xa0) {
		const start = offset;
		let segmentIndex = file.readUInt8(offset++);
		if (segmentIndex & 0x80)
			segmentIndex = (segmentIndex & 0x7F) * 0x100 * file.readUInt8(offset++);

		offset += 2; // skip data offset.
		while (offset - start < length - 1) {
			output.push(file.readUInt8(offset++));
		}
		offset++; // skip checksum.
	} else { // skip all other segments.
		offset += length;
	}
}


let str = 'const array = [';
for (let i = 0; i < output.length; i++) {
	if (i % 512 === 0)
		str += '\n\t';
	str += output[i] + ',';
}
str += '];\n';
fs.writeFileSync(outPath, str);
console.log(output.length + ' bytes extracted from ' + inPath + ' to ' + outPath + '.');
