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
	const _bob = accounts[2];
	const _carol = accounts[3];
	const _notOwner = accounts[8];
	const _wallet = accounts[9];

	const day = 24 * 60 * 60;
	const nintyDays = 90 * day;
	const thirtyDays = 30 * day;
	const fourteenDays = 14 * day;
	const sevenDays = 7 * day;

	const minWeiAmount = 0.01 * weiInEther;

	const _defaultRate = 100;
	const _cap = 100 * weiInEther;
	const _firstPeriod = {
		TIME: sevenDays,
		BONUS_RATE: 500,
		NORMAL_RATE: 300,
		CAP: 10 * weiInEther
	};

	const _secondPeriod = {
		TIME: fourteenDays,
		BONUS_RATE: 200,
		NORMAL_RATE: 150,
		CAP: 30 * weiInEther
	};

	describe("initializing crowsale", () => {

		it("should set initial values correctly", async function () {
			await timeTravel(web3, day);
			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + nintyDays;

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
		const _symbol = "ICO";

		beforeEach(async function () {

			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + nintyDays;

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
			_closingTime = _openingTime + nintyDays;

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

		it("should convert to first period bonus rate", async function () {
			await timeTravel(web3, _firstPeriod.TIME * 0.75);
			const weiSent = 1 * weiInEther;
			await basicCrowdsaleInstance.buyTokens(_wallet, {
				value: weiSent,
				from: _wallet
			});

			let balance = await tokenInstance.balanceOf.call(_wallet);

			assert(balance.eq(weiSent * _firstPeriod.BONUS_RATE), "The balance was not correct based on the first period bonus rate and weiSent");
		});

		it("should convert to first period default rate after cap", async function () {
			await timeTravel(web3, _firstPeriod.TIME * 0.75);

			const reachTheCap = (_firstPeriod.CAP) + (weiInEther);
			await basicCrowdsaleInstance.buyTokens(_wallet, {
				value: reachTheCap,
				from: _wallet
			});

			const weiSent = minWeiAmount;
			await basicCrowdsaleInstance.buyTokens(_owner, {
				value: weiSent,
				from: _owner
			});

			console.log('buy with default rate');

			let balance = await tokenInstance.balanceOf.call(_owner);

			assert(balance.eq(weiSent * _firstPeriod.NORMAL_RATE), "The balance was not correct based on the first normal bonus rate and weiSent");
		});

		// ToDo: Throw with error Error: Error: sender doesn't have enough funds to send tx. The upfront cost is: 672197500000000000 and the sender's account only has: 669133400000000000
		// it("should convert to second period bonus rate", async function () {
		// 	await timeTravel(web3, _secondPeriod.TIME * 0.75);
		// 	const weiSent = 1 * weiInEther;
		// 	await basicCrowdsaleInstance.buyTokens(_wallet, {
		// 		value: weiSent,
		// 		from: _wallet
		// 	})
		//
		// 	let balance = await tokenInstance.balanceOf.call(_wallet);
		//
		// 	assert(balance.eq(weiSent * _secondPeriod.BONUS_RATE), "The balance was not correct based on the second period bonus rate and weiSent");
		// });

		// ToDo: Throw with error Error: Error: sender doesn't have enough funds to send tx. The upfront cost is: 672197500000000000 and the sender's account only has: 669133400000000000
		// it("should convert to second period default rate after cap", async function () {
		// 	await timeTravel(web3, _secondPeriod.TIME * 0.75);
		//
		// 	const reachTheCap = (_secondPeriod.CAP) + 1;
		// 	await basicCrowdsaleInstance.buyTokens(_wallet, {
		// 		value: reachTheCap,
		// 		from: _wallet
		// 	});
		//
		// 	const weiSent = minWeiAmount;
		// 	await basicCrowdsaleInstance.buyTokens(_owner, {
		// 		value: weiSent,
		// 		from: _owner
		// 	});
		//
		// 	let balance = await tokenInstance.balanceOf.call(_owner);
		//
		// 	assert(balance.eq(weiSent * _secondPeriod.NORMAL_RATE), "The balance was not correct based on the first normal bonus rate and weiSent");
		// });

		// ToDo: Throw with error Error: Error: sender doesn't have enough funds to send tx. The upfront cost is: 672197500000000000 and the sender's account only has: 669133400000000000
		// it("should convert to  default rate", async function () {
		// 	await timeTravel(web3, thirtyDays);
		// 	const weiSent = 1 * weiInEther;
		// 	await basicCrowdsaleInstance.buyTokens(_wallet, {
		// 		value: weiSent,
		// 		from: _wallet
		// 	});
		//
		// 	let balance = await tokenInstance.balanceOf.call(_wallet);
		//
		// 	assert(balance.eq(weiSent * _defaultRate), "The balance was not correct based on the default rate and weiSent");
		// });

	})

	describe("bounty token", () => {
		let tokenInstance;

		beforeEach(async function () {

			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + nintyDays;

			tokenInstance = await ICOToken.new({
				from: _owner
			});

			basicCrowdsaleInstance = await BasicCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, _cap, {
				from: _owner
			});

			await tokenInstance.transferOwnership(basicCrowdsaleInstance.address);
			await timeTravel(web3, thirtyDays);

		});

		// ToDo: Throw with error Error: Error: sender doesn't have enough funds to send tx. The upfront cost is: 672197500000000000 and the sender's account only has: 669133400000000000
		// it("create bounty tokens", async function () {
		//
		// 	const bonusTokens = 500 * weiInEther;
		//
		// 	basicCrowdsaleInstance.createBountyToken(_alice, bonusTokens, {
		// 		from: _owner
		// 	});
		//
		// 	let balance = await tokenInstance.balanceOf.call(_alice);
		//
		// 	assert(balance.eq(bonusTokens), "The balance was not correct based on bounty tokens");
		//
		// });

		// ToDo: Throw with error Error: Error: sender doesn't have enough funds to send tx. The upfront cost is: 672197500000000000 and the sender's account only has: 669133400000000000
		// it("should throw if non owner trying to create bounty", async function () {
		// 	const bonusTokens = 500 * weiInEther;
		//
		// 	await expectThrow(basicCrowdsaleInstance.createBountyToken(_alice, bonusTokens, {
		// 		from: _notOwner
		// 	}));
		//
		// });

		// ToDo: Throw with error Error: Error: sender doesn't have enough funds to send tx. The upfront cost is: 672197500000000000 and the sender's account only has: 669133400000000000
		// it("should emit event on change", async function () {
		//
		// 	const expectedEvent = 'LogBountyTokenMinted';
		//
		// 	const bonusTokens = 500 * weiInEther;
		// 	let result = await basicCrowdsaleInstance.createBountyToken(_alice, bonusTokens, {
		// 		from: _owner
		// 	});
		// 	assert.lengthOf(result.logs, 1, "There should be 1 event emitted from setRate!");
		// 	assert.strictEqual(result.logs[0].event, expectedEvent, `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
		// });


	});

	describe('finalization', () => {

		beforeEach(async function () {

			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + nintyDays;

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

		// ToDo: Throw with error Error: Error: sender doesn't have enough funds to send tx. The upfront cost is: 672197500000000000 and the sender's account only has: 669133400000000000
		// it("should transfer ownership of the token correctly on time finish", async function () {
		// 	let initialOwner = await tokenInstance.owner.call();
		// 	await timeTravel(web3, nintyDays);
		// 	await basicCrowdsaleInstance.finalize();
		// 	let afterOwner = await tokenInstance.owner.call();
		//
		// 	assert(initialOwner != afterOwner, "The owner has not changed");
		// 	assert.equal(afterOwner, _owner, "The owner was not set to the crowdsale owner");
		// });

	})


});