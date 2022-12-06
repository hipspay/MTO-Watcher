const { ethers } = require('ethers');

import LastBlocksService from '../services/LastBlocksService';
// arranging info
import escrowABI from '../constants/escrowABI.json';
const provider = new ethers.providers.JsonRpcProvider(process.env.ALCHEMY_URL);
const address = process.env.ERC1155_EXCHANGER_ADDRESS;
console.log('ERC1155_EXCHANGER_ADDRESS', address);

// event BidCancelled(bytes32 id, uint256 eventIdBidCancelled);

const contract = new ethers.Contract(address, escrowABI, provider);
let lastBlock = parseInt(process.env.START_BLOCK);

export default class BidCancelledListener {
    lastBlocksService: LastBlocksService;
    constructor() {
        this.lastBlocksService = new LastBlocksService();
    }

    public async listen(_timeOut) {
        console.log('listen BidCancelled');
        try {
            // get lastest block
            let event_name = 'BidCancelled'; // 'add the event name here'
            const lastBlockDb =
                await this.lastBlocksService.getLastBlockByEventNameAndChainId(
                    event_name,
                    parseInt(process.env.CHAIN_ID)
                );
            // console.log('dbResult', lastBlockDb);
            if (lastBlockDb) {
                lastBlock = lastBlockDb.last_fetch_block;
            }

            // console.log('lastBlock', lastBlock);

            let block = await provider.getBlockNumber();
            // console.log('block', block);

            if (process.env.CHAIN_NAME == process.env.CHAIN_NAME_BSC) {
                if (block - lastBlock > 5000) {
                    block = lastBlock + 5000;
                }
            }
            console.log('block Diff', block - lastBlock);

            // catch events
            if (lastBlock + 1 > block) {
                setTimeout(() => this.listen(_timeOut), _timeOut);
                return;
            }
            let listedEvents;
            try {
                listedEvents = await contract.queryFilter(
                    event_name,
                    lastBlock + 1,
                    block
                );
            } catch (error) {
                console.log('catch 3', error);
                setTimeout(() => this.listen(_timeOut), _timeOut);
                return;
            }
            if (!listedEvents) {
                setTimeout(() => this.listen(_timeOut), _timeOut);
                return;
            }
            let events = [];
            listedEvents.forEach((row) => {
                console.log('row', row);
                events.push({
                    id: row.args.id.toString(),
                    eventIdBidCancelled:
                        row.args.eventIdBidCancelled.toString(),
                });
            });
            console.log(events);
            lastBlock = block;

            // make query
            if (events.length > 0) {
                for (let i = 0; i < events.length; i++) {
                    const event = events[i];
                    const tempData = await this.tempStorageService.getByEventId(
                        event.eventIdBidCancelled
                    );
                    console.log('tempData', tempData);

                    if (tempData && tempData.status == 0) {
                        const tempDataObj = JSON.parse(tempData.json_string);
                        console.log('tempDataObj', tempDataObj);
                        await this.bidService.remove(tempDataObj.bidId);
                        const updateTempData = {
                            ...tempData,
                            status: 2,
                        };
                        await this.tempStorageService.update(updateTempData);
                    } else {
                        continue;
                    }
                }
                await this.lastBlocksService.upsesrtLastBlock(
                    block,
                    event_name
                );
                setTimeout(() => this.listen(_timeOut), _timeOut);
            } else {
                await this.lastBlocksService.upsesrtLastBlock(
                    block,
                    event_name
                );
                setTimeout(() => this.listen(_timeOut), _timeOut);
            }
        } catch (error) {
            console.log('catch error', error);
            setTimeout(() => this.listen(_timeOut), _timeOut);
        }
    }
}
