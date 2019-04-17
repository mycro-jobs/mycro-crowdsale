var WhitelistedBasicCrowdsale = artifacts.require("WhitelistedBasicCrowdsale");
const MultiSigWallet = artifacts.require('MultiSigWalletWithDailyLimit');
var ICOToken = artifacts.require("ICOToken");

function getFutureTimestamp(plusMinutes) {
	let date = new Date();
	date.setMinutes(date.getMinutes() + plusMinutes)
	let timestamp = +date;
	timestamp = Math.ceil(timestamp / 1000);
	return timestamp;
}

async function getWeb3FutureTimestamp(plusMinutes) {
	let block = await web3.eth.getBlock(web3.eth.blockNumber)
	return block.timestamp + plusMinutes * 60;
}

module.exports = async function (deployer, network, accounts) {

	const isDevNetwork = (network == 'development' || network == 'td' || network == 'ganache');
	const oneMinutes = 3;
	const nintyDaysInMinutes = 90 * 24 * 60;
	const _startTime = (isDevNetwork) ? await getWeb3FutureTimestamp(oneMinutes) : await getFutureTimestamp(oneMinutes);
	const _endTime = (isDevNetwork) ? await getWeb3FutureTimestamp(nintyDaysInMinutes) : await getFutureTimestamp(nintyDaysInMinutes);
	const _defaultRate = 600;
	const account1 = "0x0e0e86a4622F679a45baE10C194f1927ad79e979";
	const account2 = "0xFeD1564d6F5cE55166DE5deBD7bD43c2902a92bd";
	const allAccounts = [account1, account2];
	const requiredConfirmations = 2;
	const dailyLimit = 0;

	const weiInEther = 1000000000000000000;

	await deployer.deploy(ICOToken);
	let tokenInstance = await ICOToken.deployed();

	await deployer.deploy(MultiSigWallet, allAccounts, requiredConfirmations, dailyLimit);
	let multiSigInstance = await MultiSigWallet.deployed();

	await deployer.deploy(WhitelistedBasicCrowdsale, _defaultRate, multiSigInstance.address, tokenInstance.address, _startTime, _endTime);
	const crowdsaleInstance = await WhitelistedBasicCrowdsale.deployed();

	await tokenInstance.transferOwnership(crowdsaleInstance.address);
	const crowdsaleOwner = (isDevNetwork) ? accounts[0] : _wallet;
	await crowdsaleInstance.transferOwnership(crowdsaleOwner);

};
