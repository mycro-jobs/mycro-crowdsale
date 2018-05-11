pragma solidity ^0.4.23;


import "zeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/distribution/FinalizableCrowdsale.sol";


contract BasicCrowdsale is MintedCrowdsale, FinalizableCrowdsale, CappedCrowdsale {

  
  constructor(uint256 _rate, address _wallet, address _token, uint256 _openingTime, uint256 _closingTime, uint256 _cap) 
    Crowdsale(_rate, _wallet, ERC20(_token)) 
    TimedCrowdsale(_openingTime, _closingTime) 
    CappedCrowdsale(_cap) public {
  }

  function _getTokenAmount(uint256 _weiAmount) internal view returns (uint256) {
	  // TODO place the logic for token generation periods and bonuses
  }

  function finalization() internal {
    MintableToken(token).transferOwnership(owner);
    super.finalization();
  }
}