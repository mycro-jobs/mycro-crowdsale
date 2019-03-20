const ethers = require('ethers');

const {
	nodeProvider,
	WhitelistedBasicCrowdsaleContract,
	WhitelistedBasicCrowdsaleContractWithWallet
} = require('./config-blockchain.js');

const WalletService = require("./wallet-services");

const basicValidators = require("./validation/basicValidaton.js");

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
		const options = {
			gasPrice: constants.gasPrice
		};

		return await WhitelistedBasicCrowdsaleContractWallet.addToWhitelist(address, options);
	}

	static async whitelistMultipleAddresses(privateKey, addresses) {
		let wallet = await WalletService.initWalletFromPrivateKey(privateKey);
		await this.validateMultiWhitelisting(addresses);

		let WhitelistedBasicCrowdsaleContractWallet = WhitelistedBasicCrowdsaleContractWallet(wallet);

		const options = {
			gasPrice: constants.gasPrice
		};

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

		let defaultRate = await WhitelistedBasicCrowdsaleContract.rate();
		let rate = defaultRate.toString();

		for (const log of logs) {
			const block = await nodeProvider.getBlock(log.blockHash)
			const logData = LogTokenPurchase.parse(log.topics, log.data)

			if (logData.beneficiary != beneficiary) {
				continue;
			}

			let weiSent = logData.value.toString();
			let tokens = logData.amount.toString();
			let bonusTokens = logData.amount - logData.value * rate;

			result.push({
				eventTime: block.timestamp,
				beneficiary: logData.beneficiary,
				weiSent: weiSent,
				tokens: tokens,
				bonusTokens: bonusTokens
			})
		}

		return result;
	}

	static async mintFiatTokens(beneficiary, amount, privateKey) {

		this.validateMintTokens(beneficiary, amount, privateKey)
		const options = {
			gasPrice: constants.gasPrice
		};

		let wallet = await WalletService.initWalletFromPrivateKey(privateKey);
		let WhitelistedBasicCrowdsaleContractWallet = WhitelistedBasicCrowdsaleContractWithWallet(wallet);

		let mintFiatTokensTx = await WhitelistedBasicCrowdsaleContractWallet.createFiatToken(beneficiary, amount, options);

		return mintFiatTokensTx;
	}

	static async mintFiatTokensToMany(beneficiaries, amounts, privateKey) {

		this.validateMintToMany(beneficiaries, amounts, privateKey)
		const options = {
			gasPrice: constants.gasPrice
		};

		let wallet = await WalletService.initWalletFromPrivateKey(privateKey);
		let WhitelistedBasicCrowdsaleContractWallet = WhitelistedBasicCrowdsaleContractWithWallet(wallet);

		let mintFiatTokensTx = await WhitelistedBasicCrowdsaleContractWallet.createFiatTokenToMany(beneficiaries, amounts, options);

		return mintFiatTokensTx;
	}

	static async mintBountyTokens(beneficiary, amount, privateKey) {

		this.validateMintTokens(beneficiary, amount, privateKey)
		const options = {
			gasPrice: constants.gasPrice
		};

		let wallet = await WalletService.initWalletFromPrivateKey(privateKey);
		let WhitelistedBasicCrowdsaleContractWallet = WhitelistedBasicCrowdsaleContractWithWallet(wallet);

		let mintBountyTokensTx = await WhitelistedBasicCrowdsaleContractWallet.createBountyToken(beneficiary, amount, options);

		return mintBountyTokensTx;
	}

	static async mintBountyTokensToMany(beneficiaries, amounts, privateKey) {

		this.validateMintToMany(beneficiaries, amounts, privateKey)
		const options = {
			gasPrice: constants.gasPrice
		};

		let wallet = await WalletService.initWalletFromPrivateKey(privateKey);
		let WhitelistedBasicCrowdsaleContractWallet = WhitelistedBasicCrowdsaleContractWithWallet(wallet);

		let mintBountyTokensToManyTx = await WhitelistedBasicCrowdsaleContractWallet.createBountyTokenToMany(beneficiaries, amounts, options);

		return mintBountyTokensToManyTx;
	}


	static async addWhitelistManager(addressToWhitelist, privateKey) {

		if (!addressToWhitelist || !privateKey) {
			throw new Error("Invalid paramteters");
		}
		const options = {
			gasPrice: constants.gasPrice
		};
		basicValidators.validatePrivateKey(privateKey);
		basicValidators.validateEtherAddress(addressToWhitelist);

		let wallet = await WalletService.initWalletFromPrivateKey(privateKey);
		let WhitelistedBasicCrowdsaleContractWallet = WhitelistedBasicCrowdsaleContractWithWallet(wallet);

		let addWhitelistManagerTx = WhitelistedBasicCrowdsaleContractWallet.addWhitelistManager(addressToWhitelist, options);

		return addWhitelistManagerTx;
	}

	static async addMinter(minterAddress, privateKey) {
		if (!minterAddress || !privateKey) {
			throw new Error("Invalid paramteters");
		}

		basicValidators.validatePrivateKey(privateKey);
		basicValidators.validateEtherAddress(minterAddress);

		const options = {
			gasPrice: constants.gasPrice
		};

		let wallet = await WalletService.initWalletFromPrivateKey(privateKey);
		let WhitelistedBasicCrowdsaleContractWallet = WhitelistedBasicCrowdsaleContractWithWallet(wallet);

		let addWhitelistManagerTx = WhitelistedBasicCrowdsaleContractWallet.addMinter(minterAddress, options);

		return addWhitelistManagerTx;
	}

	static validateMintToMany(beneficiaries, amounts, privateKey) {

		if (!beneficiaries || !amounts || !privateKey || (beneficiaries.length != amounts.length)) {
			throw new Error("Invalid paramteters");
		}
		basicValidators.validatePrivateKey(privateKey);
		for (let i = 0; i < beneficiaries.length; i++) {
			basicValidators.validateEtherAddress(beneficiaries[i]);
		}

	}

	static validateMintTokens(beneficiary, amount, privateKey) {
		if (!beneficiary || !amount || !privateKey) {
			throw new Error("Invalid paramteters");
		}
		basicValidators.validatePrivateKey(privateKey);
		basicValidators.validateEtherAddress(beneficiary);
	}

}

module.exports = CrowdsaleService;