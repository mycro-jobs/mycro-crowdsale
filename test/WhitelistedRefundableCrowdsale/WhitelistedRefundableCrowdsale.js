const WhitelistedRefundableCrowdsale = artifacts.require("./WhitelistedRefundableCrowdsale.sol");
const ICOToken = artifacts.require("./ICOToken.sol");
const web3FutureTime = require('../util').web3FutureTime;

contract('WhitelistedRefundableCrowdsale', function (accounts) {

	let tokenInstance;
	let whitelistedRefundableCrowdsaleInstance;
	let _openingTime;
	let _closingTime;

	const weiInEther = 1000000000000000000;

	const _owner = accounts[0];
	const _wallet = accounts[9];

	const day = 24 * 60 * 60;
	const nintyDays = 90 * day;

	const _defaultRate = 100;
	const _goal = 50 * weiInEther;
	const _cap = 100 * weiInEther;

	describe("initializing crowdsale", () => {

		it("should set initial values correctly", async function () {
			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + nintyDays;

			tokenInstance = await ICOToken.new({
				from: _owner
			});
			whitelistedRefundableCrowdsaleInstance = await WhitelistedRefundableCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, _cap, _goal, {
				from: _owner
			});

			await tokenInstance.transferOwnership(whitelistedRefundableCrowdsaleInstance.address);

			let openingTime = await whitelistedRefundableCrowdsaleInstance.openingTime.call();
			let closingTime = await whitelistedRefundableCrowdsaleInstance.closingTime.call();
			let wallet = await whitelistedRefundableCrowdsaleInstance.wallet.call();
			let rate = await whitelistedRefundableCrowdsaleInstance.rate.call();
			let cap = await whitelistedRefundableCrowdsaleInstance.cap.call();
			let goal = await whitelistedRefundableCrowdsaleInstance.goal.call();

			assert(openingTime.eq(_openingTime), "The start time is incorrect");
			assert(closingTime.eq(_closingTime), "The end time is incorrect");
			assert(rate.eq(_defaultRate), "The rate is incorrect");
			assert(cap.eq(_cap), "The rate is incorrect");
			assert.strictEqual(wallet, _wallet, "The start time is incorrect");
			assert(goal.eq(_goal), "The goal is incorrect");

			let token = await whitelistedRefundableCrowdsaleInstance.token.call();
			assert(token.length > 0, "Token length is 0");
			assert(token != "0x0");
		});
	});


});