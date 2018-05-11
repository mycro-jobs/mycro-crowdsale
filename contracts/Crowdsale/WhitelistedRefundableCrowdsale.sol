pragma solidity ^0.4.23;

import "./BasicCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/distribution/RefundableCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol";


contract WhitelistedRefundableCrowdsale is BasicCrowdsale, RefundableCrowdsale, WhitelistedCrowdsale {

  
  constructor(uint256 _rate, address _wallet, address _token, uint256 _openingTime, uint256 _closingTime, uint256 _cap, uint256 _goal) 
    BasicCrowdsale(_rate, _wallet, ERC20(_token), _openingTime, _closingTime, _cap)
	RefundableCrowdsale(_goal)
	 public {
  }
}