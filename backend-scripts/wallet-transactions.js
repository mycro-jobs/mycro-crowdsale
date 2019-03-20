const ethers = require('ethers');
const basicValidators = require('./validation/basicValidaton');
const currencyValidation = require('./validation/currencyValidation');
const {
	nodeProvider,
	ICOTokenContract,
	ICOTokenContractWithWallet,
	WhitelistedBasicCrowdsaleContractWithWallet
} = require('./config-blockchain');
const constants = require('./constants.json');
const ethUtils = require('./utils/ethUtils');
const crowdsaleServices = require('./crowdsale-services');

class WalletTransactions {

	/**
	 * Buy tokens from the ICO for ETH.
	 * @param {String} jsonWalletObj - The json wallet obj created when creating the wallet
	 * @param {String} password - The wallet's pasword
	 * @param {String} amount - The amount of ether in WEI the user wants to send.  Token symbols is 18 decimals
	 * @param {String} beneficiary - The address to which the Mycro tokens should be send
	 * @returns {JSON Object} - Transaction receipt object
	 */
	static async buyICOTokens(jsonWalletObj, password, amount, beneficiary) {

		this.valdidateTransactionsParams(jsonWalletObj, password, amount, beneficiary);
		basicValidators.validateEtherAddress(beneficiary);
		let isWhitelisted = await crowdsaleServices.isWhitelisted(beneficiary);
		if (!await crowdsaleServices.isWhitelisted(beneficiary)) {
			throw new Error("The user is not whitelisted");
		}

		let wallet = await ethers.Wallet.fromEncryptedWallet(jsonWalletObj, password);
		let crowdsaleCotractWalletInstance = WhitelistedBasicCrowdsaleContractWithWallet(wallet);

		await currencyValidation.validateEthBalance(wallet, constants.buyTokensGas, amount);

		var weiAmount = ethers.utils.bigNumberify(amount);

		let estimatedGas = await wallet.estimateGas(crowdsaleCotractWalletInstance.buyTokens(beneficiary));
		let calculateGas = estimatedGas.mul(35).div(100);
		let gasPrice = estimatedGas.add(calculateGas);

		var overrideOptions = {
			gasLimit: constants.buyTokensGas,
			gasPrice: gasPrice,
			value: weiAmount
		}

		let buyTokensTx = await crowdsaleCotractWalletInstance.buyTokens(beneficiary, overrideOptions);

		return buyTokensTx;
	}
	/**
	 * Function used to send Mycro tokens to a given wallet.
	 * @param {String} jsonWalletObj - The json wallet obj created when creating the wallet
	 * @param {String} password - The wallet's pasword
	 * @param {String} amount - The amount that the user want to send in WEI. Token symbols is 18 decimals
	 * @param {String} beneficiary - The address to which the Mycro TOkens should be send
	 * @returns {JSON Object} - Transaction receipt object
	 */
	static async sendMycroTokens(jsonWalletObj, password, amount, beneficiary) {

		this.valdidateTransactionsParams(jsonWalletObj, password, amount, beneficiary);
		basicValidators.validateEtherAddress(beneficiary);

		let wallet = await ethers.Wallet.fromEncryptedWallet(jsonWalletObj, password);

		await currencyValidation.validateEthBalance(wallet, constants.sendMycroTokensGas);
		let gasPrice = await ethUtils.getGasPrice();
		var weiAmount = ethers.utils.bigNumberify(amount);

		var overrideOptions = {
			gasLimit: constants.sendMycroTokensGas,
			gasPrice: gasPrice,
		}

		let tokenContractWalletInstance = await ICOTokenContractWithWallet(wallet);

		let sendMycroTokensTx = await tokenContractWalletInstance.transfer(beneficiary, weiAmount, overrideOptions);

		return sendMycroTokensTx;
	}

	/**
	 * Function used to send ether to a given wallet.
	 * @param {String} jsonWalletObj - The json wallet obj created when creating the wallet
	 * @param {String} password - The wallet's pasword
	 * @param {String} amount - The amount that the user want to send in WEI. Token symbols is 18 decimals
	 * @param {String} beneficiary - The address to which the ETH should be send
	 * @returns {JSON Object} - Transaction receipt object
	 */
	static async sendEth(jsonWalletObj, password, amount, beneficiary) {

		this.valdidateTransactionsParams(jsonWalletObj, password, amount, beneficiary);
		basicValidators.validateEtherAddress(beneficiary);

		let wallet = await ethers.Wallet.fromEncryptedWallet(jsonWalletObj, password);

		await currencyValidation.validateEthBalance(wallet, constants.sendEth, amount);
		let gasPrice = await ethUtils.getGasPrice();
		var weiAmount = ethers.utils.bigNumberify(amount);


		var overrideOptions = {
			gasLimit: constants.sendEth,
			gasPrice: gasPrice,
		}

		wallet.provider = nodeProvider;
		let sendEthTx = await wallet.send(beneficiary, weiAmount, overrideOptions);
		return sendEthTx;
	}


	/**
	 * Returns the Token balance of the user
	 * @param {String} userAddress - The address of the user
	 * @returns {BigNumber}
	 */
	static async getTokenBalance(userAddress) {

		let icoTokenInstance = await ICOTokenContract()
		return await icoTokenInstance.balanceOf(userAddress);
	}

	/**
	 * Returns the ETH balance of the user
	 * @param {String} userAddress - The address of the user
	 * @returns {BigNumber}
	 */
	static async getEthBalance(userAddress) {
		return await nodeProvider.getBalance(userAddress);
	}

	static valdidateTransactionsParams(jsonWalletObj, password, amount, beneficiary) {

		if (!jsonWalletObj || !password || !amount || !beneficiary) {
			throw new Error("Invalid function params");
		}
	}
}

module.exports = WalletTransactions;