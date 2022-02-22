import { Service } from 'typedi';
import { getRepository } from 'typeorm';

import { Customers } from '../entities/Customers';
import { ICreateCustomer } from '../shared/types/customer.types';

@Service()
export default class CustomerService {
    public async createCustomer(
        createCustomerData: ICreateCustomer
    ): Promise<Customers> {
        const customerRepository = getRepository(Customers);

        const existSameWallet = await customerRepository.find({
            where: { walletAddress: createCustomerData.walletAddress },
        });

        if (existSameWallet?.length > 0) {
            return Promise.reject('WALLET_ALREADY_EXIST');
        }

        return await customerRepository.save(createCustomerData);
    }

    public async getCustomerByAddress(address: string): Promise<Customers> {
        return await getRepository(Customers).findOne({
            where: { walletAddress: address },
        });
    }

    public async updateCustomer(
        address: string,
        updateCustomerData: Customers
    ): Promise<Customers> {
        const customerRepository = getRepository(Customers);

        const customer = await customerRepository.findOne({
            where: { walletAddress: address },
        });

        if (!customer) {
            return null;
        }

        const { name, shippingAddress, externalLink } = updateCustomerData;

        if (name) {
            customer.name = name;
        }

        if (shippingAddress) {
            customer.shippingAddress = shippingAddress;
        }

        if (externalLink) {
            customer.externalLink = externalLink;
        }

        return await customerRepository.save(customer);
    }
}
