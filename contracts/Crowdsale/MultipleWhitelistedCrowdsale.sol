pragma solidity ^0.4.24;

import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title MultipleWhitelistedCrowdsale
 * @dev Crowdsale in which only whitelisted users can contribute.
 */
contract MultipleWhitelistedCrowdsale is Crowdsale, Ownable {

  mapping(address => bool) public whitelist;
  // keeps all addresses who can manage the whitelist
  mapping(address => bool) public whitelistManagers;

  constructor() public {
      whitelistManagers[owner] = true;
  }

  /**
   * @dev Reverts if beneficiary is not whitelisted. Can be used when extending this contract.
   */
  modifier isWhitelisted(address _beneficiary) {
    require(whitelist[_beneficiary]);
    _;
  }

  /**
   * @dev Reverts if msg.sender is not whitelist manager
   */
  modifier onlyWhitelistManager(){
      require(whitelistManagers[msg.sender]);
      _;
  }

  /**
   * @dev Adds single address who can manage the whitelist.
   * @param _manager Address to be added to the whitelistManagers
   */
  function addWhitelistManager(address _manager) public onlyOwner {
      require(_manager != address(0));
      whitelistManagers[_manager] = true;
  }

  /**
  * @param _manager Address to remove from whitelistManagers
   */

  function removeWhitelistManager(address _manager) public onlyOwner {
      whitelistManagers[_manager] = false;
  }

  /**
   * @dev Adds single address to whitelist.
   * @param _beneficiary Address to be added to the whitelist
   */
  function addToWhitelist(address _beneficiary) external onlyWhitelistManager() {
    whitelist[_beneficiary] = true;
  }

  /**
   * @dev Adds list of addresses to whitelist. Not overloaded due to limitations with truffle testing.
   * @param _beneficiaries Addresses to be added to the whitelist
   */
  function addManyToWhitelist(address[] _beneficiaries) external onlyWhitelistManager() {
    for (uint256 i = 0; i < _beneficiaries.length; i++) {
      whitelist[_beneficiaries[i]] = true;
    }
  }

  /**
   * @dev Removes single address from whitelist.
   * @param _beneficiary Address to be removed to the whitelist
   */
  function removeFromWhitelist(address _beneficiary) external onlyWhitelistManager() {
    whitelist[_beneficiary] = false;
  }

  /**
   * @dev Extend parent behavior requiring beneficiary to be in whitelist.
   * @param _beneficiary Token beneficiary
   * @param _weiAmount Amount of wei contributed
   */
  function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal isWhitelisted(_beneficiary) {
    super._preValidatePurchase(_beneficiary, _weiAmount);
  }

}
