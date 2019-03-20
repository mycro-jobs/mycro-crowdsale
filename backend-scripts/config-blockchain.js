const config = require('../deployment/config.json');
const ethers = require('ethers');

const WhitelistedBasicCrowdsaleAbi = require('./contracts-abi/WhitelistedBasicCrowdsale.json').abi;
const ICOTokenAbi = require('./contracts-abi/ICOToken.json').abi;

// Setup Ethers provider from configs
const providers = ethers.providers;
const nodeProvider = getNodeProvider();

function getNodeProvider() {
	if (config.network === 'local') {
		return new providers.JsonRpcProvider("", providers.networks.unspecified);
	}
	return new providers.InfuraProvider(providers.networks[config.network], config.infura_api_key);
}

// Initiate contracts with nodeProvider
let WhitelistedBasicCrowdsaleContract = new ethers.Contract(
	config.whitelisted_basic_crowdsale_contract_address, WhitelistedBasicCrowdsaleAbi, nodeProvider);

const ICOTokenContract = async function () {
	let tokenAddress = await WhitelistedBasicCrowdsaleContract.token();
	return new ethers.Contract(tokenAddress, ICOTokenAbi, nodeProvider);
};

// Initiate contracts with wallets
const WhitelistedBasicCrowdsaleContractWithWallet = function (wallet) {
	wallet.provider = nodeProvider;

	return new ethers.Contract(config.whitelisted_basic_crowdsale_contract_address, WhitelistedBasicCrowdsaleAbi, wallet);
};

const ICOTokenContractWithWallet = async function (wallet) {
	wallet.provider = nodeProvider;
	let tokenAddress = await WhitelistedBasicCrowdsaleContract.token();

	return new ethers.Contract(tokenAddress, ICOTokenAbi, wallet);
};

module.exports = {
	nodeProvider,
	WhitelistedBasicCrowdsaleContract,
	WhitelistedBasicCrowdsaleContractWithWallet,
	ICOTokenContract,
	ICOTokenContractWithWallet
};