pragma solidity ^0.4.23;

import "./../Token/ICOToken.sol";
import "zeppelin-solidity/contracts/crowdsale/distribution/FinalizableCrowdsale.sol";


contract UnpausableFinalizableCrowdsale is FinalizableCrowdsale {

    function finalization() internal {
        if (ICOToken(token).paused()) {
            ICOToken(token).unpause();
        }
        super.finalization();
    }
}