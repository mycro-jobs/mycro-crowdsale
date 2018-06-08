const ethers = require('ethers');

const {
	nodeProvider,
	WhitelistedBasicCrowdsaleContract,
	WhitelistedRBasicCrowdsaleContractWithWallet
} = require('./config-blockchain.js');

const WalletService = require("./wallet-services");

const constants = require('./constants.json');


class CrowdsaleService {
	static async getOwner() {
		return await WhitelistedBasicCrowdsaleContract.owner();
	}

	static async getCurrentTokensForEther() {
		const etherInWei = 1000000000000000000; // 1 ETH
		let rate = await WhitelistedBasicCrowdsaleContract.getRate();
		const tokens = rate * etherInWei;
		return tokens.toString();
	}

	static async isWhitelisted(address) {
		let isWhitelisted = await WhitelistedBasicCrowdsaleContract.whitelist(address);
		return isWhitelisted;
	}

	static async whitelistAddress(privateKey, address) {
		let wallet = await WalletService.initWalletFromPrivateKey(privateKey);

		let WhitelistedBasicCrowdsaleContractWallet = WhitelistedBasicCrowdsaleContractWithWallet(wallet);
		const options = { gasPrice: constants.gasPrice };

		return await WhitelistedBasicCrowdsaleContractWallet.addToWhitelist(address, options);
	}

	static async whitelistMultipleAddresses(privateKey, addresses) {
		let wallet = await WalletService.initWalletFromPrivateKey(privateKey);
		await this.validateMultiWhitelisting(addresses);

		let WhitelistedBasicCrowdsaleContractWallet = WhitelistedBasicCrowdsaleContractWallet(wallet);

		const options = { gasPrice: constants.gasPrice };

		return await WhitelistedBasicCrowdsaleContractWallet.addManyToWhitelist(addresses, options);
	}

	static async validateMultiWhitelisting(addresses) {
		if (addresses.length > constants.maxArraysLength) {
			throw new Error("Arrays are too large for one transaction, split it in more")
		}
	}

	static async tokensPurchase(beneficiary) {
		nodeProvider.resetEventsBlock(0);
		const LogTokenPurchase = WhitelistedBasicCrowdsaleContract.interface.events.TokenPurchase;
		const logs = await nodeProvider.getLogs({
			fromBlock: 0,
			toBlock: 'latest',
    		address: WhitelistedBasicCrowdsaleContract.address,
    		topics: LogTokenPurchase.topics
		});

		const result = [];

		for(const log of logs) {
			const block = await nodeProvider.getBlock(log.blockHash)
			const logData = LogTokenPurchase.parse(log.topics, log.data)

			if(logData.beneficiary != beneficiary){
				continue;
			}

			let weiSent = logData.value.toString();
			let tokens = logData.amount.toString();
			let bonusTokens = logData.amount - logData.value*500;

			result.push({eventTime: block.timestamp, beneficiary: logData.beneficiary,
				weiSent: weiSent, tokens: tokens, bonusTokens: bonusTokens})
		}

		return result;
	}
}

module.exports = CrowdsaleService;