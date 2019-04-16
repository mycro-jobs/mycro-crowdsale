var HDWalletProvider = require("truffle-hdwallet-provider-privkey");
let testPrivateKey = '9f42c9d8e753db56330ee67b91fdd7fd47f034862f1b96e83bc65acc2e2a463b';
let infuraRopsten = 'https://ropsten.infura.io/XTIF9kIt1kgSOOKclKG0  ';
let infuraRinkeby = 'https://rinkeby.infura.io/XTIF9kIt1kgSOOKclKG0 ';
let infuraMainnet = 'https://mainnet.infura.io/XTIF9kIt1kgSOOKclKG0 ';

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*"
    },
    td: {
      host: "localhost",
      port: 9545,
      network_id: "*"
    },
    ganache: {
      host: "localhost",
      port: 7545,
      network_id: "*"
    },
    ropsten: {
      provider: function () {
        return new HDWalletProvider(testPrivateKey, infuraRopsten)
      },
      network_id: 3,
      port: 8545,
      gas: 4500000
    },
    rinkeby: {
      provider: function () {
        return new HDWalletProvider(testPrivateKey, infuraRinkeby)
      },
      network_id: 4,
      port: 8545,
      gas: 4000000
    },
    live: {
      provider: function () {
        return new HDWalletProvider(testPrivateKey, infuraMainnet)
      },
      network_id: 1,
      port: 8545,
      gasPrice: 3000000000,
      gas: 4000000
    }
  },
  compilers: {
    solc: {
      version: '0.4.24',
      optimizer: {
        enabled: true,
        runs: 999
      }
    }
  }
};