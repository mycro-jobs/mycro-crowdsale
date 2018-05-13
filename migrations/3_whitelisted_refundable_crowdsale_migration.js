var WhitelistedRefundableCrowdsale = artifacts.require("WhitelistedRefundableCrowdsale");
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
	const fifteenMinutes = 15;
	const nintyDaysInMinutes = 90 * 24 * 60;
	const _startTime = (isDevNetwork) ? getWeb3FutureTimestamp(fifteenMinutes) : getFutureTimestamp(fifteenMinutes);
	const _endTime = (isDevNetwork) ? getWeb3FutureTimestamp(nintyDaysInMinutes) : getFutureTimestamp(nintyDaysInMinutes);
	const _defaultRate = 100;
	const _wallet = '0x795EFF09B1FE788DC7e6824AA5221aD893Fd465A';

	const weiInEther = 1000000000000000000;
	const _goal = 2 * weiInEther;
	const _cap = 4 * weiInEther;

	await deployer.deploy(ICOToken);
	let tokenInstance = await ICOToken.deployed();

	await deployer.deploy(WhitelistedRefundableCrowdsale, 100, _wallet, tokenInstance.address, _startTime, _endTime, _cap, _goal);
	const crowdsaleInstance = await WhitelistedRefundableCrowdsale.deployed();

	await tokenInstance.transferOwnership(crowdsaleInstance.address);
	const crowdsaleOwner = (isDevNetwork) ? accounts[0] : _wallet;
	await crowdsaleInstance.transferOwnership(crowdsaleOwner);

};
