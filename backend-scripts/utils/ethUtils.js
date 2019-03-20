const ethers = require('ethers');
const axios = require('axios');
const {
	nodeProvider
} = require('../config-blockchain');
const constants = require('../constants.json');

class EthUtils {

	static async getGasPrice() {

		try {
			let response = await axios.get(constants.GAS_STATION_API);

			return ethers.utils.parseUnits((response.data.fast / 10).toString(10), 'gwei');

		} catch (e) {
			return await nodeProvider.getGasPrice();
		}
	}
}

module.exports = EthUtils;