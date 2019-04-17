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
	const beneficiaries = [accounts[2], accounts[3], accounts[4], accounts[5], accounts[6]];

	const day = 24 * 60 * 60;
	const nineDays = 9 * day;
	const tenDays = 10 * day;
	const thirtyDays = 30 * day;
	const fiftyDays = 50 * day;
	const sixtyDays = 60 * day;
	const ninetyDays = 90 * day;

	const minWeiAmount = 0.01 * weiInEther;
	const maxWeiAmount = 250 * weiInEther;

	const _defaultRate = 600;
	const _cap = 100000000 * weiInEther;
	const _bountyTokensCap = 5000000 * weiInEther;
	const _reservedForTeamTokens = 29000000 * weiInEther;
	const _capForSale = 71000000 * weiInEther;

	const _privateSalePeriod = {
		END: thirtyDays,
		CAP: 26000000 * weiInEther
	}

	const _mainSalePeriod = {
		END: sixtyDays,
		CAP: _capForSale - _privateSalePeriod.CAP
	};

	describe("initializing crowsale", () => {

		it("should set initial values correctly", async function () {
			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + ninetyDays;

			tokenInstance = await ICOToken.new({
				from: _owner
			});
			basicCrowdsaleInstance = await BasicCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, {
				from: _owner
			});

			let openingTime = await basicCrowdsaleInstance.openingTime.call();
			let closingTime = await basicCrowdsaleInstance.closingTime.call();
			let wallet = await basicCrowdsaleInstance.wallet.call();
			let rate = await basicCrowdsaleInstance.rate.call();
			let privateSaleEndDate = await basicCrowdsaleInstance.privateSaleEndDate.call();

			assert(openingTime.eq(_openingTime), "The start time is incorrect");
			assert(closingTime.eq(_closingTime), "The end time is incorrect");
			assert(rate.eq(_defaultRate), "The rate is incorrect");
			assert.strictEqual(wallet, _wallet, "The start time is incorrect");
			assert(privateSaleEndDate, _openingTime + sixtyDays)

			let token = await basicCrowdsaleInstance.token.call();
			assert(token.length > 0, "Token length is 0");
			assert(token != "0x0");
		});

	});

	describe("testing token creation", () => {
		const _symbol = "MYO";

		beforeEach(async function () {

			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + ninetyDays;

			tokenInstance = await ICOToken.new({
				from: _owner
			});

			basicCrowdsaleInstance = await BasicCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, {
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

		beforeEach(async function () {

			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + ninetyDays;

			tokenInstance = await ICOToken.new({
				from: _owner
			});

			basicCrowdsaleInstance = await BasicCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, {
				from: _owner
			});

			await tokenInstance.transferOwnership(basicCrowdsaleInstance.address);

		});

		it("should throw on wei below min amount", async function () {
			await timeTravel(web3, _privateSalePeriod.END);
			const weiSent = minWeiAmount / 2;
			await expectThrow(basicCrowdsaleInstance.buyTokens(_wallet, {
				value: weiSent,
				from: _wallet
			}));

		});

		it('should throw on wei over max amount', async function() {
			await timeTravel(web3, _privateSalePeriod.END);
			await expectThrow(basicCrowdsaleInstance.buyTokens(_wallet, {
				value: maxWeiAmount + weiInEther,
				from: _wallet
			}));
		})

		it('should convert to private sale period rate', async function () {
			await timeTravel(web3, _privateSalePeriod.END);
			const weiSent = 1 * weiInEther;
			await basicCrowdsaleInstance.buyTokens(_wallet, {
				value: weiSent,
				from: _wallet
			})

			let balance = await tokenInstance.balanceOf.call(_wallet);
			assert(balance.eq(weiSent * _defaultRate), "The balance is incorrect based on the private sale rate")
		})

		it('should revert if privateSale cap is reached', async function () {
			await timeTravel(web3, _privateSalePeriod.END);

			await basicCrowdsaleInstance.createFiatToken(_wallet, _privateSalePeriod.CAP);

			await expectThrow(basicCrowdsaleInstance.buyTokens(_wallet, {
				value: weiInEther,
				from: _wallet
			}));
		});

		it("should convert to main period bonus rate", async function () {
			await timeTravel(web3, _privateSalePeriod.END + tenDays);
			await basicCrowdsaleInstance.buyTokens(_wallet, {
				value: weiInEther,
				from: _wallet
			});

			let balance = await tokenInstance.balanceOf.call(_wallet);

			assert(balance.eq(weiInEther * _defaultRate), "The balance was not correct based on the main sale rate and weiSent");
		});

		it('should throw if hard capForSale is reached', async function () {
			await timeTravel(web3, _privateSalePeriod.END + tenDays);

			await basicCrowdsaleInstance.createFiatToken(_wallet, _capForSale);

			await expectThrow(basicCrowdsaleInstance.buyTokens(_wallet, {
				value: weiInEther,
				from: _wallet
			}));

		});

	});

	describe("allowed minters", () => {


		beforeEach(async function () {

			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + ninetyDays;

			tokenInstance = await ICOToken.new({
				from: _owner
			});

			basicCrowdsaleInstance = await BasicCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, {
				from: _owner
			});

			await tokenInstance.transferOwnership(basicCrowdsaleInstance.address);
		});

		it('should set owner as a minter', async function () {
			let minter = await basicCrowdsaleInstance.minters(_owner);
			assert.isTrue(minter, "The owner is not set as minter")
		})

		it('should add minter', async function () {
			await basicCrowdsaleInstance.addMinter(_alice, {
				from: _owner
			});
			let minter = await basicCrowdsaleInstance.minters(_alice);
			assert.isTrue(minter, "The _alice is not set as minter")
		})

		it('should revert if non owner tries to add minter', async function () {
			await expectThrow(basicCrowdsaleInstance.addMinter(_alice, {
				from: _notOwner
			}))
		})

		it('should revert if minter address is invalid', async function () {
			await expectThrow(basicCrowdsaleInstance.addMinter('0x0', {
				from: _owner
			}))
		})

		it('should remove minter', async function () {
			await basicCrowdsaleInstance.addMinter(_alice, {
				from: _owner
			});
			await basicCrowdsaleInstance.removeMinter(_alice, {
				from: _owner
			})
			let minter = await basicCrowdsaleInstance.minters(_alice);
			assert.isFalse(minter, "The minter was not removed")
		})

		it('should revert if non owner tries to remove minter', async function () {
			await basicCrowdsaleInstance.addMinter(_alice, {
				from: _owner
			});
			await expectThrow(basicCrowdsaleInstance.removeMinter(_alice, {
				from: _notOwner
			}))
		});

		it('should emit event on new minter added', async function () {
			const expectedEvent = 'LogMinterAdded';

			let result = await basicCrowdsaleInstance.addMinter(_alice, {
				from: _owner
			});
			assert.lengthOf(result.logs, 1, "There should be 1 event emitted from setRate!");
			assert.strictEqual(result.logs[0].event, expectedEvent, `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
		});

		it('should emit event on minter removed', async function () {
			const expectedEvent = 'LogMinterRemoved';

			await basicCrowdsaleInstance.addMinter(_alice, {
				from: _owner
			});
			let result = await basicCrowdsaleInstance.removeMinter(_alice, {
				from: _owner
			});
			assert.lengthOf(result.logs, 1, "There should be 1 event emitted from setRate!");
			assert.strictEqual(result.logs[0].event, expectedEvent, `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
		})
	})

	describe('fiat tokens', () => {
		beforeEach(async function () {

			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + ninetyDays;

			tokenInstance = await ICOToken.new({
				from: _owner
			});

			basicCrowdsaleInstance = await BasicCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, {
				from: _owner
			});

			await tokenInstance.transferOwnership(basicCrowdsaleInstance.address);
		});

		it('should create fiat tokens', async function () {
			const fiatTokens = 5000000;

			await basicCrowdsaleInstance.createFiatToken(_alice, fiatTokens, {
				from: _owner
			});

			let balance = await tokenInstance.balanceOf.call(_alice);

			assert(balance.eq(fiatTokens), "The balance was not correct based on fiat tokens minted");
		})

		it('should create fiat tokens from new added minter', async function () {
			const fiatTokens = 5000000;
			let _minter = accounts[2];

			await basicCrowdsaleInstance.addMinter(_minter, {
				from: _owner
			});
			await basicCrowdsaleInstance.createFiatToken(_alice, fiatTokens, {
				from: _minter
			})

			let balance = await tokenInstance.balanceOf.call(_alice);

			assert(balance.eq(fiatTokens), "The balance was not correct based on fiat tokens minted");
		});

		it('should revert if non minter tries to create fiat tokens', async function () {;
			const fiatTokens = 5000000;
			let _minter = accounts[2];

			await expectThrow(basicCrowdsaleInstance.createFiatToken(_alice, fiatTokens, {
				from: _minter
			}))
		})

		it('should revert if capForSale is reached', async function () {
			let fiatTokens = _capForSale;
			await basicCrowdsaleInstance.createFiatToken(_alice, fiatTokens, {
				from: _owner
			});

			await expectThrow(basicCrowdsaleInstance.createFiatToken(_alice, weiInEther, {
				from: _owner
			}))
		})

		it('should emit event on fiat tokens minted', async function () {
			const expectedEvent = 'LogFiatTokenMinted';

			const fiatTokens = 5000000;
			let result = await basicCrowdsaleInstance.createFiatToken(_alice, fiatTokens, {
				from: _owner
			});
			assert.lengthOf(result.logs, 1, "There should be 1 event emitted from setRate!");
			assert.strictEqual(result.logs[0].event, expectedEvent, `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
		});

		it('should create fiat token to many', async function () {
			const amount = [2000000, 3000000, 4000000, 5000000, 6000000];

			await basicCrowdsaleInstance.createFiatTokenToMany(beneficiaries, amount, {
				from: _owner
			});

			let balance_1 = await tokenInstance.balanceOf.call(beneficiaries[0]);
			let balance_2 = await tokenInstance.balanceOf.call(beneficiaries[1]);;
			let balance_3 = await tokenInstance.balanceOf.call(beneficiaries[2]);
			let balance_4 = await tokenInstance.balanceOf.call(beneficiaries[3]);
			let balance_5 = await tokenInstance.balanceOf.call(beneficiaries[4]);

			assert(balance_1.eq(amount[0]), "The balance was not correct based on fiat tokens minted");
			assert(balance_2.eq(amount[1]), "The balance was not correct based on fiat tokens minted");
			assert(balance_3.eq(amount[2]), "The balance was not correct based on fiat tokens minted");
			assert(balance_4.eq(amount[3]), "The balance was not correct based on fiat tokens minted");
			assert(balance_5.eq(amount[4]), "The balance was not correct based on fiat tokens minted");
		});

		it('should revert if notOwner tries to create fiat token to many', async function () {
			const amount = [2000000, 3000000, 4000000, 5000000, 6000000];

			await expectThrow(basicCrowdsaleInstance.createFiatTokenToMany(beneficiaries, amount, {
				from: _notOwner
			}));
		});

		it('should revert if beneficiaries and amount lengths are 0', async function () {
			let emptyBeneficiaries = [];
			let emptyAmount = [];

			await expectThrow(basicCrowdsaleInstance.createFiatTokenToMany(emptyBeneficiaries, emptyAmount, {
				from: _owner
			}));
		});

		it('should revert if beneficiaries.length is not equal to amount.length', async function () {
			const amount = [2000000, 3000000];

			await expectThrow(basicCrowdsaleInstance.createFiatTokenToMany(beneficiaries, amount, {
				from: _owner
			}))
		})

		it('should emit event on fiat tokens created to many', async function () {
			const expectedEvent = 'LogFiatTokenMintedToMany';

			const amount = [2000000, 3000000, 4000000, 5000000, 6000000];

			let result = await basicCrowdsaleInstance.createFiatTokenToMany(beneficiaries, amount, {
				from: _owner
			});
			assert.lengthOf(result.logs, 1, "There should be 1 event emitted from setRate!");
			assert.strictEqual(result.logs[0].event, expectedEvent, `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
		});

	})

	describe("bounty token", () => {

		beforeEach(async function () {

			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + ninetyDays;

			tokenInstance = await ICOToken.new({
				from: _owner
			});

			basicCrowdsaleInstance = await BasicCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, {
				from: _owner
			});

			await tokenInstance.transferOwnership(basicCrowdsaleInstance.address);

		});

		it("should create bounty tokens", async function () {

			const bonusTokens = 5000000;

			await basicCrowdsaleInstance.createBountyToken(_alice, bonusTokens, {
				from: _owner
			});

			let balance = await tokenInstance.balanceOf.call(_alice);

			assert(balance.eq(bonusTokens), "The balance was not correct based on bounty tokens");

		});

		it('should create bounty tokens from new added minter', async function () {
			const bonusTokens = 5000000;
			let _minter = accounts[2];

			await basicCrowdsaleInstance.addMinter(_minter, {
				from: _owner
			});
			await basicCrowdsaleInstance.createBountyToken(_alice, bonusTokens, {
				from: _minter
			})

			let balance = await tokenInstance.balanceOf.call(_alice);

			assert(balance.eq(bonusTokens), "The balance was not correct based on bounty tokens");
		})

		it("should throw if non minter tries to create bounty", async function () {
			const bonusTokens = 5000000;
			let _notMinter = accounts[2];

			await expectThrow(basicCrowdsaleInstance.createBountyToken(_alice, bonusTokens, {
				from: _notMinter
			}));

		});

		it('should update totalMintedBountyTokens amount', async function () {
			let _bob = accounts[4];
			const bountyTokensForAlice = 5000000;
			const bountyTokensForBob = 3000000;

			await basicCrowdsaleInstance.createBountyToken(_alice, bountyTokensForAlice, {
				from: _owner
			});
			await basicCrowdsaleInstance.createBountyToken(_bob, bountyTokensForBob, {
				from: _owner
			});

			let totalBountyTokens = await basicCrowdsaleInstance.totalMintedBountyTokens.call()
			assert(totalBountyTokens.eq(bountyTokensForAlice + bountyTokensForBob))
		})

		it('should throw if bounty cap is reached', async function () {
			let bountyTokens = _bountyTokensCap;
			await basicCrowdsaleInstance.createBountyToken(_alice, bountyTokens, {
				from: _owner
			});

			await expectThrow(basicCrowdsaleInstance.createBountyToken(_alice, weiInEther, {
				from: _owner
			}))

		});

		it('should revert if capForSale is reached', async function () {
			let tokens = _capForSale;
			//to reach the cap, we first create fiat tokens otherwise we'll reach the bounty tokens cap of 50000000
			await basicCrowdsaleInstance.createFiatToken(_alice, tokens, {
				from: _owner
			});

			await expectThrow(basicCrowdsaleInstance.createBountyToken(_alice, weiInEther, {
				from: _owner
			}))
		});


		it("should emit event on bounty tokens minted", async function () {

			const expectedEvent = 'LogBountyTokenMinted';

			const bonusTokens = 5000000;
			let result = await basicCrowdsaleInstance.createBountyToken(_alice, bonusTokens, {
				from: _owner
			});
			assert.lengthOf(result.logs, 1, "There should be 1 event emitted from setRate!");
			assert.strictEqual(result.logs[0].event, expectedEvent, `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
		});

		it('should create bounty token to many', async function () {
			const amount = [2000000, 3000000, 4000000, 5000000, 6000000];

			await basicCrowdsaleInstance.createBountyTokenToMany(beneficiaries, amount, {
				from: _owner
			});

			let balance_1 = await tokenInstance.balanceOf.call(beneficiaries[0]);
			let balance_2 = await tokenInstance.balanceOf.call(beneficiaries[1]);;
			let balance_3 = await tokenInstance.balanceOf.call(beneficiaries[2]);
			let balance_4 = await tokenInstance.balanceOf.call(beneficiaries[3]);
			let balance_5 = await tokenInstance.balanceOf.call(beneficiaries[4]);

			assert(balance_1.eq(amount[0]), "The balance was not correct based on fiat tokens minted");
			assert(balance_2.eq(amount[1]), "The balance was not correct based on fiat tokens minted");
			assert(balance_3.eq(amount[2]), "The balance was not correct based on fiat tokens minted");
			assert(balance_4.eq(amount[3]), "The balance was not correct based on fiat tokens minted");
			assert(balance_5.eq(amount[4]), "The balance was not correct based on fiat tokens minted");
		});

		it('should revert if notOwner tries to create bounty token to many', async function () {
			const amount = [2000000, 3000000, 4000000, 5000000, 6000000];

			await expectThrow(basicCrowdsaleInstance.createBountyTokenToMany(beneficiaries, amount, {
				from: _notOwner
			}));
		});

		it('should throw if bounty cap is reached when mint to many', async function () {
			const amount = [2000000, _bountyTokensCap, 4000000, 5000000, 6000000];

			await expectThrow(basicCrowdsaleInstance.createBountyTokenToMany(beneficiaries, amount, {
				from: _owner
			}))

			let balance = await tokenInstance.balanceOf.call(beneficiaries[0])
			assert(balance.eq(0), 'The balance of the first beneficiary in the array should be 0')
		});

		it('should throw if capForSale is reached when mint to many', async function () {
			let tokens = _capForSale;
			//to reach the cap, we first create fiat tokens otherwise we'll reach the bounty tokens cap of 50000000
			await basicCrowdsaleInstance.createFiatToken(_alice, tokens, {
				from: _owner
			});

			const amount = [2000000, 3000000, 4000000, 5000000, 6000000]

			await expectThrow(basicCrowdsaleInstance.createBountyTokenToMany(beneficiaries, amount, {
				from: _owner
			}));
		})

		it('should revert if beneficiaries and amount lengths are 0', async function () {
			let emptyBeneficiaries = [];
			let emptyAmount = [];

			await expectThrow(basicCrowdsaleInstance.createBountyTokenToMany(emptyBeneficiaries, emptyAmount, {
				from: _owner
			}));
		});

		it('should revert if beneficiaries.length is not equal to amount.length', async function () {
			const amount = [2000000, 3000000];

			await expectThrow(basicCrowdsaleInstance.createBountyTokenToMany(beneficiaries, amount, {
				from: _owner
			}))
		})

		it('should update totalMintedBountyTokens amount after created to many', async function () {
			const amount = [2000000, 3000000, 4000000, 5000000, 6000000];

			await basicCrowdsaleInstance.createBountyTokenToMany(beneficiaries, amount, {
				from: _owner
			});

			let totalBountyTokens = await basicCrowdsaleInstance.totalMintedBountyTokens.call();
			assert(totalBountyTokens.eq(amount.reduce((a, b) => a + b, 0)))
		})

		it('should emit event on bounty tokens created to many', async function () {
			const expectedEvent = 'LogBountyTokenMintedToMany';

			const amount = [2000000, 3000000, 4000000, 5000000, 6000000];

			let result = await basicCrowdsaleInstance.createBountyTokenToMany(beneficiaries, amount, {
				from: _owner
			});
			assert.lengthOf(result.logs, 1, "There should be 1 event emitted from setRate!");
			assert.strictEqual(result.logs[0].event, expectedEvent, `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
		});


	});

	describe('private sale extension', async function () {

		beforeEach(async function () {

			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + ninetyDays;

			tokenInstance = await ICOToken.new({
				from: _owner
			});

			basicCrowdsaleInstance = await BasicCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, {
				from: _owner
			});

			await tokenInstance.transferOwnership(basicCrowdsaleInstance.address);
		});

		it('should allow onlyOwner to extend private sale duration', async () => {
			let initialDuration = await basicCrowdsaleInstance.privateSaleEndDate.call();
			await basicCrowdsaleInstance.extendPrivateSaleDuration(10, {
				from: _owner
			})
			let newDuration = await basicCrowdsaleInstance.privateSaleEndDate.call();
			
			assert(newDuration.eq(initialDuration.toNumber() + tenDays), "Private sale duration was not extended")
		})

		it('should revert if not owner tries to extend private sale duration', async () => {
			await expectThrow(basicCrowdsaleInstance.extendPrivateSaleDuration(10, {
				from: _notOwner
			}))
		})

		it('should not allow to extend private sale period if it has already expired', async () => {
			await timeTravel(web3, _privateSalePeriod.END + day);
			await expectThrow(basicCrowdsaleInstance.extendPrivateSaleDuration(10, {
				from: _owner
			}));
		});

		it('should not allow to extend private sale period if it has already expired after been extended once', async () => {
			await timeTravel(web3, _privateSalePeriod.END);
			await basicCrowdsaleInstance.extendPrivateSaleDuration(10, {
				from: _owner
			});
			await timeTravel(web3, 12 * day);

			await expectThrow(basicCrowdsaleInstance.extendPrivateSaleDuration(10, {
				from: _owner
			}));
		});

		it("should emit event on private sale extension", async function () {

			const expectedEvent = 'LogPrivateSaleExtended';

			let result = await basicCrowdsaleInstance.extendPrivateSaleDuration(10, {
				from: _owner
			});
			assert.lengthOf(result.logs, 1, "There should be 1 event emitted from setRate!");
			assert.strictEqual(result.logs[0].event, expectedEvent, `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
		});

	})

	describe('main sale extension', () => {
		beforeEach(async function () {

			_openingTime = await web3FutureTime(web3);
			_closingTime = _openingTime + ninetyDays;

			tokenInstance = await ICOToken.new({
				from: _owner
			});

			basicCrowdsaleInstance = await BasicCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, {
				from: _owner
			});

			await tokenInstance.transferOwnership(basicCrowdsaleInstance.address);
		});

		it('should allow onlyOwner to extend main sale duration', async () => {
			let initialDuration = await basicCrowdsaleInstance.closingTime.call();
			await timeTravel(web3, _privateSalePeriod.END + day);
			await basicCrowdsaleInstance.extendMainSailDuration(10, {
				from: _owner
			})
			let newDuration = await basicCrowdsaleInstance.closingTime.call();

			assert.equal(newDuration.toString(), (initialDuration.toNumber() + tenDays).toString(), "Private sale duration was not extended")
		})

		it('should revert if not owner tries to extend main sale duration', async () => {
			await expectThrow(basicCrowdsaleInstance.extendMainSailDuration(10, {
				from: _notOwner
			}))
		})

		it('should not allow to extend main sale period if it has already expired', async () => {
			await timeTravel(web3, ninetyDays + day);
			await expectThrow(basicCrowdsaleInstance.extendMainSailDuration(10, {
				from: _owner
			}));
		});

		it('should not allow to extend main sale period if we are still in privatesale', async () => {
			await timeTravel(web3, _privateSalePeriod.END - day);
			await expectThrow(basicCrowdsaleInstance.extendMainSailDuration(10, {
				from: _owner
			}));
		});

		it('should not allow to extend main sale period if it has already expired after been extended once', async () => {
			await timeTravel(web3, ninetyDays - day);
			await basicCrowdsaleInstance.extendMainSailDuration(10, {
				from: _owner
			});
			await timeTravel(web3, 12 * day);

			await expectThrow(basicCrowdsaleInstance.extendMainSailDuration(10, {
				from: _owner
			}));
		});

		it('should not allow to extend main sale period more than 60 days', async () => {
			await timeTravel(web3, ninetyDays - day);
			await basicCrowdsaleInstance.extendMainSailDuration(20, {
				from: _owner
			});
			await timeTravel(web3, 20 * day);

			await basicCrowdsaleInstance.extendMainSailDuration(40, {
				from: _owner
			});

			await timeTravel(web3, 40 * day);

			await expectThrow(basicCrowdsaleInstance.extendMainSailDuration(1, {
				from: _owner
			}));

		})

		it("should emit event on main sale extension", async function () {
			await timeTravel(web3, _privateSalePeriod.END + day);
			const expectedEvent = 'LogMainSaleExtended';

			let result = await basicCrowdsaleInstance.extendMainSailDuration(10, {
				from: _owner
			});
			assert.lengthOf(result.logs, 1, "There should be 1 event emitted from setRate!");
			assert.strictEqual(result.logs[0].event, expectedEvent, `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
		});


	})

	describe('closingtime', () => {
		beforeEach(async function () {

			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + ninetyDays;

			tokenInstance = await ICOToken.new({
				from: _owner
			});

			basicCrowdsaleInstance = await BasicCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, {
				from: _owner
			});

			await tokenInstance.transferOwnership(basicCrowdsaleInstance.address);
		});

		it('should extend closing time too if privateSale period is extended', async function () {
			let closingTimeBefore = await basicCrowdsaleInstance.closingTime.call();
			await basicCrowdsaleInstance.extendPrivateSaleDuration(10, {
				from: _owner
			});
			let closingtimeAfter = await basicCrowdsaleInstance.closingTime.call();

			assert(closingTimeBefore.eq(closingtimeAfter - tenDays), "Closing time is incorrect based on privatesale extention");
		})

		it('should not allow to buy tokens if closingTime is over', async function () {
			await timeTravel(web3, _privateSalePeriod.END + sixtyDays + day)

			await expectThrow(basicCrowdsaleInstance.buyTokens(_wallet, {
				value: weiInEther,
				from: _wallet
			}));
		})

		it('should allow to buy tokens if initial closingTime is over but the privatesale period was extended', async function () {

			await basicCrowdsaleInstance.extendPrivateSaleDuration(10, {
				from: _owner
			});
			await timeTravel(web3, ninetyDays + day);
			await basicCrowdsaleInstance.buyTokens(_wallet, {
				value: weiInEther,
				from: _wallet
			});

			let balance = await tokenInstance.balanceOf.call(_wallet);
			assert(balance.eq(weiInEther * _defaultRate));
		})

	})

	describe('change default rate', () => {
		beforeEach(async function () {

			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + ninetyDays;

			tokenInstance = await ICOToken.new({
				from: _owner
			});

			basicCrowdsaleInstance = await BasicCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, {
				from: _owner
			});

			await tokenInstance.transferOwnership(basicCrowdsaleInstance.address);
		});

		it('should change the default rate', async function () {
			let newRate = 900;
			let rateBefore = await basicCrowdsaleInstance.rate.call();
			await basicCrowdsaleInstance.changeRate(newRate, {
				from: _owner
			});
			let rateAfter = await basicCrowdsaleInstance.rate.call();

			assert.notEqual(rateBefore, rateAfter);
			assert.equal(rateAfter, newRate)
		})

		it('should revert if notOwner tries to change the default rate', async function () {
			let newRate = 900;
			await expectThrow(basicCrowdsaleInstance.changeRate(newRate, {
				from: _notOwner
			}));
		})

		it('should revert if newRate is 0', async function () {
			let newRate = 0;
			await expectThrow(basicCrowdsaleInstance.changeRate(newRate, {
				from: _owner
			}))
		});

		it("should emit event on change rate", async function () {
			let newRate = 950;
			const expectedEvent = 'LogRateChanged';

			let result = await basicCrowdsaleInstance.changeRate(newRate, {
				from: _owner
			});
			assert.lengthOf(result.logs, 1, "There should be 1 event emitted from setRate!");
			assert.strictEqual(result.logs[0].event, expectedEvent, `The event emitted was ${result.logs[0].event} instead of ${expectedEvent}`);
		});
	})

	describe('finalization', () => {

		beforeEach(async function () {

			_openingTime = web3FutureTime(web3);
			_closingTime = _openingTime + ninetyDays;

			tokenInstance = await ICOToken.new({
				from: _owner
			});

			basicCrowdsaleInstance = await BasicCrowdsale.new(_defaultRate, _wallet, tokenInstance.address, _openingTime, _closingTime, {
				from: _owner
			});

			await tokenInstance.transferOwnership(basicCrowdsaleInstance.address);

			await timeTravel(web3, _privateSalePeriod.END + _mainSalePeriod.END * 0.75);
			await basicCrowdsaleInstance.buyTokens(_wallet, {
				value: weiInEther,
				from: _wallet
			})

		});

		it("should transfer ownership of the token correctly on time finish", async function () {
			let initialOwner = await tokenInstance.owner.call();
			await timeTravel(web3, _privateSalePeriod.END + _mainSalePeriod.END + day);
			await basicCrowdsaleInstance.finalize();
			let afterOwner = await tokenInstance.owner.call();

			assert(initialOwner != afterOwner, "The owner has not changed");
			assert.equal(afterOwner, _owner, "The owner was not set to the crowdsale owner");
		});

		it("should be closed", async function () {
			let before = await basicCrowdsaleInstance.isFinalized.call();
			await timeTravel(web3, _privateSalePeriod.END + _mainSalePeriod.END + day);
			await basicCrowdsaleInstance.finalize();

			let after = await basicCrowdsaleInstance.isFinalized.call();
			assert(before != after);
			assert.equal(after, true);
		})

	})


});