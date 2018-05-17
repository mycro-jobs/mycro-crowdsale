const WhitelistedRefundableCrowdsale = artifacts.require("./WhitelistedRefundableCrowdsale.sol");
const ICOToken = artifacts.require("./ICOToken.sol");
const web3FutureTime = require('../util').web3FutureTime;
const timeTravel = require('../util').timeTravel;
const ether = require('../util').ether;
const expectThrow = require('../util').expectThrow;

const BigNumber = web3.BigNumber;

contract('WhitelistedRefundableCrowdsale', function (accounts) {

	let tokenInstance;
	let whitelistedRefundableCrowdsaleInstance;
	let _openingTime;
	let _closingTime;

	const weiInEther = 1000000000000000000;

	const _owner = accounts[0];
	const _authorized = accounts[1];
	const _unauthorized = accounts[2];
	const _anotherAuthorized = accounts[3];
	const _anotherAuthorized2 = accounts[4];
	const _wallet = accounts[9];

	const day = 24 * 60 * 60;
	const nintyDays = 90 * day;

	const _defaultRate = 100;
	const _goal = ether(50);
	const _cap = ether(100);

	const value = ether(42);
	const tokenSupply = new BigNumber('1e22');

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
			await whitelistedRefundableCrowdsaleInstance.buyTokens(_authorized, { value: weiInEther, from: _authorized });
			await whitelistedRefundableCrowdsaleInstance.buyTokens(_authorized, { value: value, from: _unauthorized });
			// ToDo: What to asset in this test?
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
			await whitelistedRefundableCrowdsaleInstance.buyTokens(_anotherAuthorized, { value: weiInEther, from: _anotherAuthorized });
			await whitelistedRefundableCrowdsaleInstance.buyTokens(_anotherAuthorized, { value: weiInEther, from: _unauthorized });
			await whitelistedRefundableCrowdsaleInstance.buyTokens(_anotherAuthorized2, { value: weiInEther, from: _anotherAuthorized });
			await whitelistedRefundableCrowdsaleInstance.buyTokens(_anotherAuthorized2, { value: weiInEther, from: _unauthorized });
			// ToDo: What to asset in this test?
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
			await whitelistedRefundableCrowdsaleInstance.buyTokens(_authorized, { value: weiInEther, from: _wallet });

			await timeTravel(web3, nintyDays);
			await whitelistedRefundableCrowdsaleInstance.finalize();
			await whitelistedRefundableCrowdsaleInstance.claimRefund({ from: _wallet });
			// ToDo: What to asset in this test?
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

			const pre = web3.eth.getBalance(_wallet);
			await whitelistedRefundableCrowdsaleInstance.finalize();
			const post = web3.eth.getBalance(_wallet);

			const goalBN = new BigNumber(_goal);
			const balanceDiffBN = post.minus(pre);

			// ToDo: Compare big numbers
			// assert(goalBN.strictEqual(balanceDiffBN, 'Funds didnt send to wallet'));
		});

	});

});