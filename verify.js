const axios = require('axios');
const querystring = require('querystring');
const ethers = require("ethers");
const fs = require('fs');
const path = require('path');
// const {flat} = require('./flattener.js');

// Verify
let verify = async () => {
    // Encode parameters
    let encoder = new ethers.utils.AbiCoder();
    // Change to your constructor parameters
    let types = ["uint256", "address", "address", "uint256", "uint256"];
    const crowdsaleDuration = 84 * 24 * 60 * 60; // Till 15th May + 60 days = 84days
    const openingTime = 1555891200; // 22 April 2019 00:00 h
    const closingTime = openingTime + crowdsaleDuration;
    let values = [600, "0xf603B0226B2901464E6833d1424340547Ac0bcE3", "0x50987e6BE405ebac691f8988304562E5efc3B2ea", openingTime, closingTime];
    let encodedConstructorArgs = await encoder.encode(types, values);
    encodedConstructorArgs = encodedConstructorArgs.substr(2);
    console.log(encodedConstructorArgs);
    return;
    // Flatten the contract
    // Change to your contract path
    let filePath = "./contracts/Token/ICOToken.sol";
    // let flattenFileResult = await flat(filePath);

    // Read the contract
    let contractText = fs.readFileSync(path.resolve(__dirname, flattenFileResult.filePath), 'utf8');

    let apiKey = '6Z49ZJZX1D9VI5S53FCY28WMT4UTRSA4RA'; // This should be user input

    // Change with your contract details on mainnet
    let contractAddress = "0x50987e6BE405ebac691f8988304562E5efc3B2ea";
    let contractName = "ICOToken";
    let flatContractCode = contractText;
    let compileVersion = "v0.4.25+commit.59dbf8f1"; // could be checked with solcjs --version if ^ is used in pragma
    let runs = 200;
    let optimizer = 1; // 0 = Optimization used, 1 = No Optimization

    let data = {
        apikey: apiKey,                                 //A valid API-Key is required
        module: 'contract',                             //Do not change
        action: 'verifysourcecode',                     //Do not change
        contractaddress: contractAddress,               //Contract Address starts with 0x...
        sourceCode: flatContractCode,                   //Contract Source Code (Flattened if necessary)
        contractname: contractName,                     //ContractName
        compilerversion: compileVersion,                // see http://etherscan.io/solcversions for list of support versions
        optimizationUsed: optimizer,                    //0 = Optimization used, 1 = No Optimization
        runs: runs,                                     //set to 200 as default unless otherwise
        constructorArguements: "",    //if applicable
        // libraryname1: $('#libraryname1').val(),         //if applicable, a matching pair with libraryaddress1 required
        // libraryaddress1: $('#libraryaddress1').val(),   //if applicable, a matching pair with libraryname1 required
        // libraryname2: $('#libraryname2').val(),         //if applicable, matching pair required
        // libraryaddress2: $('#libraryaddress2').val(),   //if applicable, matching pair required
    };

    let stringData = querystring.stringify(data);
    let res = await axios.post('https://api.etherscan.io/api', stringData);
    console.log(res.data);
};

let checkVerification = async () => {
    let params = {
        guid: 'irssteefnuawac8hm6updx5sr9ut92zj3nfr6jzfcfclv5xrgh', //Replace with your Source Code GUID receipt above
        module: "contract",
        action: "checkverifystatus"
    };
    const response = await axios.get('http://api.etherscan.io/api', {params});
    console.log(response);
};

let run = async () => {
    await verify();
    // await checkVerification();
};
run();