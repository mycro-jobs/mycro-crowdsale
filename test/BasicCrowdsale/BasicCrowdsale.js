const BasicCrowdsale = artifacts.require("./BasicCrowdsale.sol");
const ICOToken = artifacts.require("./ICOToken.sol");
const expectThrow = require('../util').expectThrow;
const timeTravel = require('../util').timeTravel;
const web3FutureTime = require('../util').web3FutureTime;

contract('BasicCrowdsale', function (accounts) {

	let tokenInstance;
	let basicCrowdsaleInstance;
	let _openingTime;
	let _closingTime;

	const weiInEther = 1000000000000000000;

	const _owner = accounts[0];
	const _alice = accounts[1];
	const _notOwner = accounts[8];
	const _wallet = accounts[9];

	const day = 24 * 60 * 60;
	const tenDays = 10 * day;
	// const nintyDays = 90 * day;
	// const thirtyDays = 30 * day;
	const fiftyDays = 50 * day;
	const fourteenDays = 14 * day;
	// const sevenDays = 7 * day;

	const minWeiAmount = 0.01 * weiInEther;

	const _defaultRate = 2894;
	const _cap = 100000 * weiInEther;

	const _presalePeriod = {
		TIME: tenDays,
		RATE: 3193,
		CAP: 1000 * weiInEther
	};

	const _firstPeriod = {
		TIME: _presalePeriod.TIME + fourteenDays,
		RATE: 2927,
		CAP: _presalePeriod.CAP + 2000 * weiInEther
	};

	const _secondPeriod = {
		TIME: _firstPeriod.TIME + fourteenDays,
		RATE: 2794,
		CAP: _firstPeriod.CAP + 30000 * weiInEther
	};

	const _thirdPeriod = {
		TIME: _secondPeriod.TIME + fourteenDays,
		RATE: 2661,
		CAP: _secondPeriod.CAP + 40000 * weiInEther
	};

	const _forthPeriod = {
		TIME: _thirdPeriod.TIME + fiftyDays,
		RATE: 2894,
		CAP: _thirdPeriod.CAP + 5000
	};

	describe("initializing crowsale", () => {

		it("should set initial values correctly", async function () {
			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + _forthPeriod.TIME;

			tokenInstance = await ICOToken.new({
				from: _owner
			});
			basicCrowdsaleInstance = await BasicCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, _cap, {
				from: _owner
			});

			let openingTime = await basicCrowdsaleInstance.openingTime.call();
			let closingTime = await basicCrowdsaleInstance.closingTime.call();
			let wallet = await basicCrowdsaleInstance.wallet.call();
			let rate = await basicCrowdsaleInstance.rate.call();
			let cap = await basicCrowdsaleInstance.cap.call();

			assert(openingTime.eq(_openingTime), "The start time is incorrect");
			assert(closingTime.eq(_closingTime), "The end time is incorrect");
			assert(rate.eq(_defaultRate), "The rate is incorrect");
			assert(cap.eq(_cap), "The rate is incorrect");
			assert.strictEqual(wallet, _wallet, "The start time is incorrect");

			let token = await basicCrowdsaleInstance.token.call();
			assert(token.length > 0, "Token length is 0");
			assert(token != "0x0");
		});

	});

	describe("testing token creation", () => {
		let tokenInstance;
		const _symbol = "MYO";

		beforeEach(async function () {

			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + _forthPeriod.TIME;

			tokenInstance = await ICOToken.new({
				from: _owner
			});

			basicCrowdsaleInstance = await BasicCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, _cap, {
				from: _owner
			});

			await tokenInstance.transferOwnership(basicCrowdsaleInstance.address);
		});

		it("should create the correct token", async function () {
			let tokenSymbol = await tokenInstance.symbol.call();
			assert.equal(tokenSymbol, _symbol, "It has not created token with the correct symbol");
		});

		it("should create the token unpaused", async function () {
			let paused = await tokenInstance.paused.call();
			assert.isFalse(paused, "The token was created paused");
		});

		it("should create the token owned by the crowdsale", async function () {
			let owner = await tokenInstance.owner.call();
			assert.equal(owner, basicCrowdsaleInstance.address, "The token was with the crowdsale as owner");
		});


	});

	describe("testing crowdsale periods", () => {
		let tokenInstance;

		beforeEach(async function () {

			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + _forthPeriod.TIME;

			tokenInstance = await ICOToken.new({
				from: _owner
			});

			basicCrowdsaleInstance = await BasicCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, _cap, {
				from: _owner
			});

			await tokenInstance.transferOwnership(basicCrowdsaleInstance.address);
		});

		it("should throw on wei below min amount", async function () {
			await timeTravel(web3, _firstPeriod.TIME * 0.75);
			const weiSent = minWeiAmount / 2;
			await expectThrow(basicCrowdsaleInstance.buyTokens(_wallet, {
				value: weiSent,
				from: _wallet
			}));

		});

		it("should convert to presale period bonus rate", async function () {
			await timeTravel(web3, _presalePeriod.TIME * 0.75);
			const weiSent = 1 * weiInEther;
			await basicCrowdsaleInstance.buyTokens(_wallet, {
				value: weiSent,
				from: _wallet
			});

			let balance = await tokenInstance.balanceOf.call(_wallet);

			assert(balance.eq(weiSent * _presalePeriod.RATE), "The balance was not correct based on the first period bonus rate and weiSent");
		});

		it("should throw if presale cap is reached", async function () {
			await timeTravel(web3, _presalePeriod.TIME * 0.75);

			await basicCrowdsaleInstance.buyTokens(_wallet, {
				value: _presalePeriod.CAP,
				from: _wallet
			});

			const weiSent = 1 * weiInEther;

			await expectThrow(basicCrowdsaleInstance.buyTokens(_wallet, {
				value: weiSent,
				from: _wallet
			}));
		});

		it("should convert to first period bonus rate", async function () {
			await timeTravel(web3, _firstPeriod.TIME * 0.75);
			const weiSent = 1 * weiInEther;
			await basicCrowdsaleInstance.buyTokens(_wallet, {
				value: weiSent,
				from: _wallet
			});

			let balance = await tokenInstance.balanceOf.call(_wallet);

			assert(balance.eq(weiSent * _firstPeriod.RATE), "The balance was not correct based on the first period bonus rate and weiSent");
		});

		it("should throw if first period cap is reached", async function () {
			await timeTravel(web3, _presalePeriod.TIME * 0.75);

			await basicCrowdsaleInstance.buyTokens(_wallet, {
				value: _firstPeriod.CAP,
				from: _wallet
			});

			const weiSent = 1 * weiInEther;

			await expectThrow(basicCrowdsaleInstance.buyTokens(_wallet, {
				value: weiSent,
				from: _wallet
			}));
		});

		it("should convert to second period bonus rate", async function () {
			await timeTravel(web3, _secondPeriod.TIME * 0.75);
			const weiSent = weiInEther;
			await basicCrowdsaleInstance.buyTokens(_wallet, {
				value: weiSent,
				from: _wallet
			});

			let balance = await tokenInstance.balanceOf.call(_wallet);

			assert(balance.eq(weiSent * _secondPeriod.RATE), "The balance was not correct based on the second period bonus rate and weiSent");
		});

		it("should throw if second period cap is reached", async function () {
			await timeTravel(web3, _secondPeriod.TIME * 0.75);

			await basicCrowdsaleInstance.buyTokens(_wallet, {
				value: _secondPeriod.CAP,
				from: _wallet
			});

			const weiSent = 1 * weiInEther;

			await expectThrow(basicCrowdsaleInstance.buyTokens(_wallet, {
				value: weiSent,
				from: _wallet
			}));
		});

		it("should convert to third period bonus rate", async function () {
			await timeTravel(web3, _thirdPeriod.TIME * 0.75);
			const weiSent = weiInEther;
			await basicCrowdsaleInstance.buyTokens(_wallet, {
				value: weiSent,
				from: _wallet
			});

			let balance = await tokenInstance.balanceOf.call(_wallet);

			assert(balance.eq(weiSent * _thirdPeriod.RATE), "The balance was not correct based on the second period bonus rate and weiSent");
		});

		it("should throw if third period cap is reached", async function () {
			await timeTravel(web3, _thirdPeriod.TIME * 0.75);

			await basicCrowdsaleInstance.buyTokens(_wallet, {
				value: _thirdPeriod.CAP,
				from: _wallet
			});

			const weiSent = 1 * weiInEther;

			await expectThrow(basicCrowdsaleInstance.buyTokens(_wallet, {
				value: weiSent,
				from: _wallet
			}));
		});


		it("should convert to  default rate", async function () {
			await timeTravel(web3, _forthPeriod.TIME * 0.75);
			const weiSent = 1 * weiInEther;
			await basicCrowdsaleInstance.buyTokens(_wallet, {
				value: weiSent,
				from: _wallet
			});

			let balance = await tokenInstance.balanceOf.call(_wallet);

			assert(balance.eq(weiSent * _defaultRate), "The balance was not correct based on the default rate and weiSent");
		});

	});

	describe("bounty token", () => {
		let tokenInstance;

		beforeEach(async function () {

			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + _forthPeriod.TIME;

			tokenInstance = await ICOToken.new({
				from: _owner
			});

			basicCrowdsaleInstance = await BasicCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, _cap, {
				from: _owner
			});

			await tokenInstance.transferOwnership(basicCrowdsaleInstance.address);
			await timeTravel(web3, _forthPeriod.TIME);

		});

		it("create bounty tokens", async function () {

			const bonusTokens = 500 * weiInEther;

			await basicCrowdsaleInstance.createBountyToken(_alice, bonusTokens, {
				from: _owner
			});

			let balance = await tokenInstance.balanceOf.call(_alice);

			assert(balance.eq(bonusTokens), "The balance was not correct based on bounty tokens");

		});

		it("should throw if non owner trying to create bounty", async function () {
			const bonusTokens = 500 * weiInEther;

			await expectThrow(basicCrowdsaleInstance.createBountyToken(_alice, bonusTokens, {
				from: _notOwner
			}));

		});

		it("should emit event on change", async function () {

			const expectedEvent = 'LogBountyTokenMinted';

			const bonusTokens = 500 * weiInEther;
			let result = await basicCrowdsaleInstance.createBountyToken(_alice, bonusTokens, {
				from: _owner
			});
			assert.lengthOf(result.logs, 1, "There should be 1 event emitted from setRate!");
			assert.strictEqual(result.logs[0].event, expectedEvent, `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
		});


	});

	describe('finalization', () => {

		beforeEach(async function () {

			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + _forthPeriod.TIME;

			tokenInstance = await ICOToken.new({
				from: _owner
			});

			basicCrowdsaleInstance = await BasicCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, _cap, {
				from: _owner
			});

			await tokenInstance.transferOwnership(basicCrowdsaleInstance.address);

			await timeTravel(web3, _firstPeriod.TIME * 0.75);
			const weiSent = 1 * weiInEther;
			await basicCrowdsaleInstance.buyTokens(_wallet, {
				value: weiSent,
				from: _wallet
			})

		});

		it("should transfer ownership of the token correctly on time finish", async function () {
			let initialOwner = await tokenInstance.owner.call();
			await timeTravel(web3, _forthPeriod.TIME);
			await basicCrowdsaleInstance.finalize();
			let afterOwner = await tokenInstance.owner.call();

			assert(initialOwner != afterOwner, "The owner has not changed");
			assert.equal(afterOwner, _owner, "The owner was not set to the crowdsale owner");
		});

		it("should be closed", async function () {
			let before = await basicCrowdsaleInstance.isFinalized.call();
			await timeTravel(web3, _forthPeriod.TIME);
			await basicCrowdsaleInstance.finalize();

			let after = await basicCrowdsaleInstance.isFinalized.call();
			assert(before != after);
			assert.equal(after, true);
		})

	})


});