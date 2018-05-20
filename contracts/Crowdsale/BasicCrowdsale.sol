pragma solidity ^0.4.23;


import "zeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/distribution/FinalizableCrowdsale.sol";


contract BasicCrowdsale is MintedCrowdsale, FinalizableCrowdsale, CappedCrowdsale {

    uint256 constant MIN_CONTRIBUTION_AMOUNT = 10 finney;

    uint256 constant BONUS_1_CAP = 10 ether;
    uint256 constant BONUS_1_RATE = 300;
    uint256 constant BONUS_1_BONUS_RATE = 500;
    uint256 constant BONUS_1_DURATION = 7 days;

    uint256 constant BONUS_2_CAP = 30 ether;
    uint256 constant BONUS_2_RATE = 150;
    uint256 constant BONUS_2_BONUS_RATE = 200;
    uint256 constant BONUS_2_DURATION = BONUS_1_DURATION + 7 days;

    event LogBountyTokenMinted(address minter, address beneficiary, uint256 amount);

    constructor(uint256 _rate, address _wallet, address _token, uint256 _openingTime, uint256 _closingTime, uint256 _cap)
    Crowdsale(_rate, _wallet, ERC20(_token))
    TimedCrowdsale(_openingTime, _closingTime)
    CappedCrowdsale(_cap) public {
    }

    function buyTokens(address beneficiary) public payable {
        require(msg.value >= MIN_CONTRIBUTION_AMOUNT);
        super.buyTokens(beneficiary);
    }

    function getRate() public constant returns (uint256) {

        // First Bonus Period
        if (now < (openingTime + BONUS_1_DURATION)) {
            if (weiRaised < BONUS_1_CAP) {
                return BONUS_1_BONUS_RATE;
            }
            return BONUS_1_RATE;
        }

        //Second Bonus Period
        if (now < (openingTime + (BONUS_2_DURATION))) {
            if (weiRaised < BONUS_2_CAP) {
                return BONUS_2_BONUS_RATE;
            }
            return BONUS_2_RATE;
        }

        // Default Period
        return rate;
    }

    function _getTokenAmount(uint256 _weiAmount) internal view returns (uint256) {
        uint256 _rate = getRate();
        return _weiAmount.mul(_rate);
    }

    function createBountyToken(address beneficiary, uint256 amount) public onlyOwner returns (bool) {
        require(!hasClosed());
        MintableToken(token).mint(beneficiary, amount);
        LogBountyTokenMinted(msg.sender, beneficiary, amount);
        return true;
    }

    function finalization() internal {
        MintableToken(token).transferOwnership(owner);
        super.finalization();
    }
}