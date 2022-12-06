import { Service } from 'typedi';
import { getRepository } from 'typeorm';
import { LastBlock } from '../entities/lastBlock.entity';

@Service()
export default class LastBlocksService {
    public async getLastBlockByEventNameAndChainId(
        event_name,
        chain_id
    ): Promise<any> {
        const lastBlocksRepository = getRepository(LastBlock);
        return lastBlocksRepository
            .createQueryBuilder('LastBlock')
            .where('LastBlock.event_name = :event_name', {
                event_name: event_name,
            })
            .andWhere('LastBlock.chain_id = :chain_id', { chain_id: chain_id })
            .getOne();
    }

    public async add(lastBlock): Promise<any> {
        const lastBlocksRepository = getRepository(LastBlock);
        return lastBlocksRepository.save(lastBlock);
    }

    public async update(updateLasBlockDTO): Promise<any> {
        const lastBlocksRepository = getRepository(LastBlock);
        return lastBlocksRepository.update(
            updateLasBlockDTO.id,
            updateLasBlockDTO
        );
    }

    public async upsesrtLastBlock(lastBlock, eventName): Promise<any> {
        const dbResult = await this.getLastBlockByEventNameAndChainId(
            eventName,
            parseInt(process.env.CHAIN_ID)
        );
        if (dbResult) {
            const dbObj = {
                id: dbResult.id,
                event_name: eventName,
                last_fetch_block: lastBlock,
            };
            return this.update(dbObj);
        } else {
            const dbObj = {
                event_name: eventName,
                last_fetch_block: lastBlock,
                chain_id: parseInt(process.env.CHAIN_ID),
            };
            return this.add(dbObj);
        }
    }
}
