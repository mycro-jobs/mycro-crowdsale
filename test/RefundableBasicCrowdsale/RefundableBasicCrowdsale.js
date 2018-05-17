const RefundableBasicCrowdsale = artifacts.require("./RefundableBasicCrowdsale.sol");
const ICOToken = artifacts.require("./ICOToken.sol");
const web3FutureTime = require('../util').web3FutureTime;

contract('RefundableBasicCrowdsale', function (accounts) {

	let tokenInstance;
	let refundableBasicCrowdsaleInstance;
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
			refundableBasicCrowdsaleInstance = await RefundableBasicCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, _cap, _goal, {
				from: _owner
			});

			await tokenInstance.transferOwnership(refundableBasicCrowdsaleInstance.address);

			let openingTime = await refundableBasicCrowdsaleInstance.openingTime.call();
			let closingTime = await refundableBasicCrowdsaleInstance.closingTime.call();
			let wallet = await refundableBasicCrowdsaleInstance.wallet.call();
			let rate = await refundableBasicCrowdsaleInstance.rate.call();
			let cap = await refundableBasicCrowdsaleInstance.cap.call();
			let goal = await refundableBasicCrowdsaleInstance.goal.call();

			assert(openingTime.eq(_openingTime), "The start time is incorrect");
			assert(closingTime.eq(_closingTime), "The end time is incorrect");
			assert(rate.eq(_defaultRate), "The rate is incorrect");
			assert(cap.eq(_cap), "The rate is incorrect");
			assert.strictEqual(wallet, _wallet, "The start time is incorrect");
			assert(goal.eq(_goal), "The goal is incorrect");

			let token = await refundableBasicCrowdsaleInstance.token.call();
			assert(token.length > 0, "Token length is 0");
			assert(token != "0x0");
		});
	});


});