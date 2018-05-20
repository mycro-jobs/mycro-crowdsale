const config = require('./config.json');
const ethers = require('ethers');

const WhitelistedRefundableCrowdsaleAbi = require('./contracts-abi/WhitelistedRefundableCrowdsale.json').abi;
const ICOTokenAbi = require('./contracts-abi/ICOToken.json').abi;

// Setup Ethers provider from configs
const providers = ethers.providers;
const nodeProvider = getNodeProvider();

function getNodeProvider() {
	if (config.blockchain.network === 'local') {
		return new providers.JsonRpcProvider("", providers.networks.unspecified);
	}
	return new providers.InfuraProvider(providers.networks[config.blockchain.network], config.blockchain.infura_api_key);
}

// Initiate contracts with nodeProvider
let WhitelistedRefundableCrowdsaleContract = new ethers.Contract(
	config.blockchain.whitelisted_refundable_crowdsale_contract_address, WhitelistedRefundableCrowdsaleAbi, nodeProvider);

const ICOTokenContract = async function () {
	let tokenAddress = await WhitelistedRefundableCrowdsaleContract.token();
	return new ethers.Contract(tokenAddress, ICOTokenAbi, nodeProvider);
};

// Initiate contracts with wallets
const WhitelistedRefundableCrowdsaleContractWithWallet = function (wallet) {
	wallet.provider = nodeProvider;

	return new ethers.Contract(config.blockchain.whitelisted_refundable_crowdsale_contract_address, WhitelistedRefundableCrowdsaleAbi, wallet);
};

const ICOTokenContractWithWallet = async function (wallet) {
	wallet.provider = nodeProvider;
	let tokenAddress = await WhitelistedRefundableCrowdsaleContract.token();

	return new ethers.Contract(tokenAddress, ICOTokenAbi, wallet);
};

module.exports = {
	nodeProvider,
	WhitelistedRefundableCrowdsaleContract,
	WhitelistedRefundableCrowdsaleContractWithWallet,
	ICOTokenContract,
	ICOTokenContractWithWallet
};