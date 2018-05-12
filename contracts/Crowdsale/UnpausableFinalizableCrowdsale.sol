pragma solidity ^0.4.23;

import "zeppelin-solidity/contracts/crowdsale/distribution/FinalizableCrowdsale.sol";


contract UnpausableFinaliszableCrowdsale is FinalizableCrowdsale {

    function finalization() internal {
        if (token.paused()) {
            token.unpause();
        }
        super.finalization();
    }
}