const constants = require("../constants.json");

class BasicValidation {

	static validatePrivateKey(privateKey) {

		if (privateKey.length != constants.privateKeyLength) {
			throw new Error("The given private key is not valid");
		}
	}

	static validateEtherAddress(address) {
		if (address === '0x0000000000000000000000000000000000000000') throw new Error("Invalid ETH address");
		else if (address.substring(0, 2) !== '0x') throw new Error("Invalid ETH adress");
		else if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) throw new Error("Invalid ETH adress");
		else if (/^(0x)?[0-9a-f]{40}$/.test(address) ||
			/^(0x)?[0-9A-F]{40}$/.test(address)) return true;
		else
			return true;
	}

	static validatePassword(password) {
		if (password === '') {
			throw new Error("Invalid password");
		}

		return true;
	}

}

module.exports = BasicValidation;