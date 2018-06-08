var WhitelistedBasicCrowdsale = artifacts.require("WhitelistedBasicCrowdsale");
var ICOToken = artifacts.require("ICOToken");

function getFutureTimestamp(plusMinutes) {
	let date = new Date();
	date.setMinutes(date.getMinutes() + plusMinutes)
	let timestamp = +date;
	timestamp = Math.ceil(timestamp / 1000);
	return timestamp;
}

function getWeb3FutureTimestamp(plusMinutes) {
	return web3.eth.getBlock(web3.eth.blockNumber).timestamp + plusMinutes * 60;
}

module.exports = async function (deployer, network, accounts) {

	const isDevNetwork = (network == 'development' || network == 'td' || network == 'ganache');
	const oneMinutes = 1;
	const nintyDaysInMinutes = 90 * 24 * 60;
	const _startTime = (isDevNetwork) ? getWeb3FutureTimestamp(oneMinutes) : getFutureTimestamp(oneMinutes);
	const _endTime = (isDevNetwork) ? getWeb3FutureTimestamp(nintyDaysInMinutes) : getFutureTimestamp(nintyDaysInMinutes);
	const _defaultRate = 100;
	const _wallet = '0x2aB2829D8759775b0d2A4301f7692ED83561A30e';

	const weiInEther = 1000000000000000000;
	const _cap = 500 * weiInEther;

	await deployer.deploy(ICOToken);
	let tokenInstance = await ICOToken.deployed();

	await deployer.deploy(WhitelistedBasicCrowdsale, 100, _wallet, tokenInstance.address, _startTime, _endTime, _cap);
	const crowdsaleInstance = await WhitelistedBasicCrowdsale.deployed();

	await tokenInstance.transferOwnership(crowdsaleInstance.address);
	const crowdsaleOwner = (isDevNetwork) ? accounts[0] : _wallet;
	await crowdsaleInstance.transferOwnership(crowdsaleOwner);

};
