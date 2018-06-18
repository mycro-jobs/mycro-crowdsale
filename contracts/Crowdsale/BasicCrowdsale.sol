pragma solidity ^0.4.23;


import "zeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/distribution/FinalizableCrowdsale.sol";


contract BasicCrowdsale is MintedCrowdsale, FinalizableCrowdsale, CappedCrowdsale {

    uint256 constant MIN_CONTRIBUTION_AMOUNT = 10 finney;

    uint256 constant PRESALE_CAP = 1000 ether;
    uint256 constant PRESALE_RATE = 3193;
    uint256 constant PRESALE_DURATION = 14 days;


    uint256 constant BONUS_1_CAP = PRESALE_CAP + 2000 ether;
    uint256 constant BONUS_1_RATE = 2927;
    uint256 constant BONUS_1_DURATION = PRESALE_DURATION +10 days;

    uint256 constant BONUS_2_CAP = BONUS_1_CAP + 3000 ether;
    uint256 constant BONUS_2_RATE = 2794;
    uint256 constant BONUS_2_DURATION = BONUS_1_DURATION + 14 days;

    uint256 constant BONUS_3_CAP = BONUS_2_CAP + 4000 ether;
    uint256 constant BONUS_3_RATE = 2661;
    uint256 constant BONUS_3_DURATION = BONUS_2_DURATION + 14 days;

    uint256 constant BONUS_4_CAP = BONUS_3_CAP + 5000 ether;
    uint256 constant REGULAR_RATE = 2894;
    uint256 constant FINALIZATION_TIME = BONUS_3_DURATION + 50 days;

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

        //Presale Period
        if(now < openingTime + PRESALE_DURATION){
            require(weiRaised < PRESALE_CAP);
            return PRESALE_RATE;
        }

        // First Bonus Period
        if(now < openingTime + BONUS_1_DURATION) {
            require(weiRaised < BONUS_1_CAP);
            return BONUS_1_RATE;
        }

        //Second Bonus Period
        if(now < openingTime + BONUS_2_DURATION) {
            require(weiRaised < BONUS_2_CAP);
            return BONUS_2_RATE;
        }

        //Third Bonus Period
        if(now < openingTime + BONUS_3_DURATION) {
            require(weiRaised < BONUS_3_CAP);
            return BONUS_3_RATE;
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