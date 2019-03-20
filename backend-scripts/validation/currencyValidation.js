const ethers = require('ethers');
const {
	nodeProvider,
	ICOTokenContract
} = require('../config-blockchain');
const ethUtils = require('../utils/ethUtils');

class CurrencyValidation {

	static async validateEthBalance(wallet, actionGas = 0, value = 0) {

		const customerBalance = await nodeProvider.getBalance(wallet.address);
		const gasPrice = await ethUtils.getGasPrice();

		const gasAmountAction = gasPrice.mul(actionGas);
		const amountNeeded = gasAmountAction.add(value);

		if (amountNeeded.gt(customerBalance)) {
			throw new Error("Insufficient ETH amount");
		}
	}

	static async validateTokenBalance(wallet, value) {

		tokenAmount = ethers.utils.bigNumberify(value);
		let tokenContractInstance = await ICOTokenContract();
		let tokenBalance = await tokenContractInstance.balanceOf(wallet.address);
		if (tokenAmount.gt(tokenBalance)) {
			throw new Error("Unsufficient Token amount");
		}
	}

}

module.exports = CurrencyValidation;