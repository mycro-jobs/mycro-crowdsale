const WhitelistedBasicCrowdsale = artifacts.require("./WhitelistedBasicCrowdsale.sol");
const ICOToken = artifacts.require("./ICOToken.sol");
const web3FutureTime = require('../util').web3FutureTime;

contract('WhitelistedBasicCrowdsale', function (accounts) {

	let tokenInstance;
	let whitelistedBasicCrowdsaleInstance;
	let _openingTime;
	let _closingTime;

	const weiInEther = 1000000000000000000;

	const _owner = accounts[0];
	const _wallet = accounts[9];

	const day = 24 * 60 * 60;
	const allDays = 102 * day;

	const _defaultRate = 500;
	const _cap = 5000 * weiInEther;

	describe("initializing crowdsale", () => {

		it("should set initial values correctly", async function () {
			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + allDays;

			tokenInstance = await ICOToken.new({
				from: _owner
			});
			whitelistedBasicCrowdsaleInstance = await WhitelistedBasicCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, _cap, {
				from: _owner
			});

			await tokenInstance.transferOwnership(whitelistedBasicCrowdsaleInstance.address);
			let openingTime = await whitelistedBasicCrowdsaleInstance.openingTime.call();
			let closingTime = await whitelistedBasicCrowdsaleInstance.closingTime.call();
			let wallet = await whitelistedBasicCrowdsaleInstance.wallet.call();
			let rate = await whitelistedBasicCrowdsaleInstance.rate.call();
			let cap = await whitelistedBasicCrowdsaleInstance.cap.call();

			assert(openingTime.eq(_openingTime), "The start time is incorrect");
			assert(closingTime.eq(_closingTime), "The end time is incorrect");
			assert(rate.eq(_defaultRate), "The rate is incorrect");
			assert(cap.eq(_cap), "The rate is incorrect");
			assert.strictEqual(wallet, _wallet, "The start time is incorrect");

			let token = await whitelistedBasicCrowdsaleInstance.token.call();
			assert(token.length > 0, "Token length is 0");
			assert(token != "0x0");
		});
	});


});