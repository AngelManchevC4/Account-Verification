var Encoding = require('dw/crypto/Encoding');

function encodeId(id) {
    return Encoding.toBase64(new dw.util.Bytes(id, 'UTF-8'));
}

function decodeId(encodedId) {
    return new dw.util.Bytes(Encoding.fromBase64(encodedId)).toString();
}

module.exports = {
    encodeId: encodeId,
    decodeId: decodeId
}