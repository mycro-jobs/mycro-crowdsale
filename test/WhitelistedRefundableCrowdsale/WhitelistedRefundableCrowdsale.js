const WhitelistedRefundableCrowdsale = artifacts.require("./WhitelistedRefundableCrowdsale.sol");
const ICOToken = artifacts.require("./ICOToken.sol");
const web3FutureTime = require('../util').web3FutureTime;
const timeTravel = require('../util').timeTravel;
const ether = require('../util').ether;
const expectThrow = require('../util').expectThrow;
const BN = require('bn.js');

contract('WhitelistedRefundableCrowdsale', function (accounts) {

	let tokenInstance;
	let whitelistedRefundableCrowdsaleInstance;
	let _openingTime;
	let _closingTime;

	const _owner = accounts[0];
	const _authorized = accounts[1];
	const _unauthorized = accounts[2];
	const _anotherAuthorized = accounts[3];
	const _anotherAuthorized2 = accounts[4];
	const _wallet = accounts[9];

	const day = 24 * 60 * 60;
	const nintyDays = 90 * day;

	const weiInEther = 1000000000000000000;

	const _defaultRate = 100;
	const _goal = ether(50);
	const _cap = ether(100);

	const value = ether(42);

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

	// Whitelisting tests
	describe('single user whitelisting', function () {
		beforeEach(async function () {
			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + nintyDays;

			tokenInstance = await ICOToken.new({
				from: _owner
			});
			whitelistedRefundableCrowdsaleInstance = await WhitelistedRefundableCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, _cap, _goal, {
				from: _owner
			});

			await tokenInstance.transferOwnership(whitelistedRefundableCrowdsaleInstance.address);

			await whitelistedRefundableCrowdsaleInstance.addToWhitelist(_authorized, { from: _owner });

			await timeTravel(web3, day);
		});

		it('should accept payments to whitelisted (from whichever buyers)', async function () {
			const balanceBeforeFirstBuy = await tokenInstance.balanceOf.call(_authorized);
			await whitelistedRefundableCrowdsaleInstance.buyTokens(_authorized, { value: ether(1), from: _authorized });
			const balanceAfterFirstBuy = await tokenInstance.balanceOf.call(_authorized);
			await whitelistedRefundableCrowdsaleInstance.buyTokens(_authorized, { value: value, from: _unauthorized });
			const balanceAfterSecondBuy = await tokenInstance.balanceOf.call(_authorized);

			assert(balanceAfterFirstBuy.gt(balanceBeforeFirstBuy), 'Incorrect balance after buy token');
			assert(balanceAfterSecondBuy.gt(balanceAfterFirstBuy), 'Incorrect balance after buy token');
		});

		it('should reject payments to not whitelisted', async function () {
			await expectThrow(whitelistedRefundableCrowdsaleInstance.buyTokens(_unauthorized, { value: value, from: _owner }));
		});

		it('should reject payments to addresses removed from whitelist', async function () {
			await whitelistedRefundableCrowdsaleInstance.removeFromWhitelist(_authorized);
			await expectThrow(whitelistedRefundableCrowdsaleInstance.buyTokens(_authorized, { value: value, from: _authorized }));
		});

		it('should correctly report whitelisted addresses', async function () {
			let isAuthorized = await whitelistedRefundableCrowdsaleInstance.whitelist(_authorized);
			assert.isTrue(isAuthorized, 'Authorized account listing failed');
			let isntAuthorized = await whitelistedRefundableCrowdsaleInstance.whitelist(_unauthorized);
			assert.isFalse(isntAuthorized, 'Unauthorized account listing failed');
		});
	});

	describe('many user whitelisting', function () {
		beforeEach(async function () {
			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + nintyDays;

			tokenInstance = await ICOToken.new({
				from: _owner
			});
			whitelistedRefundableCrowdsaleInstance = await WhitelistedRefundableCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, _cap, _goal, {
				from: _owner
			});

			await tokenInstance.transferOwnership(whitelistedRefundableCrowdsaleInstance.address);

			await whitelistedRefundableCrowdsaleInstance.addManyToWhitelist([_anotherAuthorized, _anotherAuthorized2], { from: _owner });

			await timeTravel(web3, day);
		});

		it('should accept payments to whitelisted (from whichever buyers)', async function () {
			const balanceBeforeFirstBuy = await tokenInstance.balanceOf.call(_anotherAuthorized);
			await whitelistedRefundableCrowdsaleInstance.buyTokens(_anotherAuthorized, { value: ether(1), from: _anotherAuthorized });
			const balanceAfterFirstBuy = await tokenInstance.balanceOf.call(_anotherAuthorized);

			await whitelistedRefundableCrowdsaleInstance.buyTokens(_anotherAuthorized, { value: ether(1), from: _unauthorized });
			const balanceAfterSecondBuy = await tokenInstance.balanceOf.call(_anotherAuthorized);

			const balanceBeforeFirstBuy2 = await tokenInstance.balanceOf.call(_anotherAuthorized2);
			await whitelistedRefundableCrowdsaleInstance.buyTokens(_anotherAuthorized2, { value: ether(1), from: _anotherAuthorized });
			const balanceAfterFirstBuy2 = await tokenInstance.balanceOf.call(_anotherAuthorized2);

			await whitelistedRefundableCrowdsaleInstance.buyTokens(_anotherAuthorized2, { value: ether(1), from: _unauthorized });
			const balanceAfterSecondBuy2 = await tokenInstance.balanceOf.call(_anotherAuthorized2);

			assert(balanceAfterFirstBuy.gt(balanceBeforeFirstBuy), 'Incorrect balance after buy token');
			assert(balanceAfterSecondBuy.gt(balanceAfterFirstBuy), 'Incorrect balance after buy token');
			assert(balanceAfterFirstBuy2.gt(balanceBeforeFirstBuy2), 'Incorrect balance after buy token');
			assert(balanceAfterSecondBuy2.gt(balanceAfterFirstBuy2), 'Incorrect balance after buy token');
		});

		it('should reject payments to addresses removed from whitelist', async function () {
			await whitelistedRefundableCrowdsaleInstance.removeFromWhitelist(_anotherAuthorized2);
			await expectThrow(whitelistedRefundableCrowdsaleInstance.buyTokens(_anotherAuthorized2, { value: value, from: _anotherAuthorized }));
		});

		describe('reporting whitelisted', function () {
			it('should correctly report whitelisted addresses', async function () {
				let isAuthorized = await whitelistedRefundableCrowdsaleInstance.whitelist(_anotherAuthorized);
				assert.isTrue(isAuthorized, 'Authorized account listing failed');
				let isAnotherAuthorized = await whitelistedRefundableCrowdsaleInstance.whitelist(_anotherAuthorized2);
				assert.isTrue(isAnotherAuthorized, 'Authorized account listing failed');
				let isntAuthorized = await whitelistedRefundableCrowdsaleInstance.whitelist(_unauthorized);
				assert.isFalse(isntAuthorized, 'Unauthorized account listing failed');
			});
		});
	});

	// Refundable tests
	describe('refundable crowdsale tests', function () {
		beforeEach(async function () {
			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + nintyDays;

			tokenInstance = await ICOToken.new({
				from: _owner
			});
			whitelistedRefundableCrowdsaleInstance = await WhitelistedRefundableCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, _cap, _goal, {
				from: _owner
			});

			await tokenInstance.transferOwnership(whitelistedRefundableCrowdsaleInstance.address);
			await whitelistedRefundableCrowdsaleInstance.addToWhitelist(_authorized, { from: _owner });
		});

		it('should fail with zero goal', async function () {
			await expectThrow(WhitelistedRefundableCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, _cap, 0, {
				from: _owner
			}));
		});

		it('should deny refunds before end', async function () {
			await timeTravel(web3, day);
			await expectThrow(whitelistedRefundableCrowdsaleInstance.claimRefund({ from: _wallet }));
		});

		it('should allow refunds after end if goal was not reached', async function () {
			await timeTravel(web3, day);
			await whitelistedRefundableCrowdsaleInstance.buyTokens(_authorized, { value: ether(1), from: _wallet });

			await timeTravel(web3, nintyDays);
			await whitelistedRefundableCrowdsaleInstance.finalize();
			const balanceBeforeClaimRefund = await web3.eth.getBalance(_wallet);
			await whitelistedRefundableCrowdsaleInstance.claimRefund({ from: _wallet });
			const balanceAfterClaimRefund = await web3.eth.getBalance(_wallet);

			assert(balanceAfterClaimRefund.gt(balanceBeforeClaimRefund), 'Claim refund failed');
		});

		it('should deny refunds after end if goal was reached', async function () {
			await timeTravel(web3, day);
			await whitelistedRefundableCrowdsaleInstance.buyTokens(_authorized, { value: _goal, from: _wallet });

			await timeTravel(web3, nintyDays);
			await whitelistedRefundableCrowdsaleInstance.finalize();
			await expectThrow(whitelistedRefundableCrowdsaleInstance.claimRefund({ from: _wallet }));
		});

		it('should forward funds to wallet after end if goal was reached', async function () {
			await timeTravel(web3, day);

			await whitelistedRefundableCrowdsaleInstance.buyTokens(_authorized, { value: _goal, from: _authorized });

			await timeTravel(web3, nintyDays);

			const pre = await web3.eth.getBalance(_wallet);
			await whitelistedRefundableCrowdsaleInstance.finalize();
			const post = await web3.eth.getBalance(_wallet);

			const balanceDiff = post.sub(pre);

			assert(_goal.eq(balanceDiff), 'Funds did not send to wallet');
		});

	});

});