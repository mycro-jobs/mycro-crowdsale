const ethers = require('ethers');

const {
	WhitelistedRefundableCrowdsaleContract,
	WhitelistedRefundableCrowdsaleContractWithWallet
} = require('./config-blockchain.js');

const WalletService = require("./wallet-services");

const constants = require('./constants.json');


class CrowdsaleService {
	static async getOwner() {
		return await WhitelistedRefundableCrowdsaleContract.owner();
	}

	static async getCurrentTokensForEther() {
		const etherInWei = 1000000000000000000; // 1 ETH
		let rate = await WhitelistedRefundableCrowdsaleContract.getRate();
		const tokens = rate * etherInWei;
		return tokens.toString();
	}

	static async isWhitelisted(address) {
		let isWhitelisted = await WhitelistedRefundableCrowdsaleContract.whitelist(address);
		return isWhitelisted;
	}

	static async whitelistAddress(privateKey, address) {
		let wallet = await WalletService.initWalletFromPrivateKey(privateKey);

		let WhitelistedRefundableCrowdsaleContractWallet = WhitelistedRefundableCrowdsaleContractWithWallet(wallet);
		const options = { gasPrice: constants.gasPrice };

		return await WhitelistedRefundableCrowdsaleContractWallet.addToWhitelist(address, options);
	}

	static async whitelistMultipleAddresses(privateKey, addresses) {
		let wallet = await WalletService.initWalletFromPrivateKey(privateKey);
		await this.validateMultiWhitelisting(addresses);

		let WhitelistedRefundableCrowdsaleContractWallet = WhitelistedRefundableCrowdsaleContractWithWallet(wallet);

		const options = { gasPrice: constants.gasPrice };

		return await WhitelistedRefundableCrowdsaleContractWallet.addManyToWhitelist(addresses, options);
	}

	static async validateMultiWhitelisting(addresses) {
		if (addresses.length > constants.maxArraysLength) {
			throw new Error("Arrays are too large for one transaction, split it in more")
		}
	}
}

module.exports = CrowdsaleService;