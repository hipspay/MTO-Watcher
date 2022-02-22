import { Service } from 'typedi';
import { getRepository, Raw } from 'typeorm';

import { Products } from '../entities/Products';
import { Orders } from '../entities/Orders';
import { Customers } from '../entities/Customers';
import { OrderStatus } from '../shared/constants/global.constants';

@Service()
export default class OrderService {
    public async handleEscrow(
        _from: string,
        _productID: number,
        escrowDisputableTime: number,
        escrowWithdrawableTime: number,
        _escrowId: number
    ): Promise<any> {
        const customerRepository = getRepository(Customers);
        const orderRepository = getRepository(Orders);
        const productRepository = getRepository(Products);
        console.log('event received');
        const customer = await customerRepository.findOne({
            where: { walletAddress: _from },
        });
        console.log('customer found');
        const product = await productRepository.findOne({
            where: {
                id: _productID,
            },
        });
        console.log('product found');

        const createdOrder = await orderRepository.save({
            escrowId: _escrowId,
            customer: customer,
            status: OrderStatus.IN_DELIVERY,
            product,
            // it should be delivery time and not disputable time
            deliveryTime: new Date(escrowDisputableTime * 1000),
            escrowTime: new Date(escrowWithdrawableTime * 1000),
        });

        console.log('created order');
        return customer;
    }

    public async handleWithdraw(
        _escrowId: number,
        _productId: number
    ): Promise<any> {
        const orderRepository = getRepository(Orders);
        const productRepository = getRepository(Products);
        const order = await orderRepository.findOne({
            where: {
                escrowId: _escrowId,
            },
        });
        const product = await productRepository.findOne({
            where: {
                id: _productId,
            },
        });
        if (product) {
            product.soldOutItems = product.soldOutItems + 1;
            await productRepository.save(product);
            console.log('done Update');
        }

        if (!order) {
            return null;
        } else {
            order.status = OrderStatus.COMPLETED;
            const orderUpdated = await orderRepository.save(order);
            console.log('updated Status');
            return orderUpdated;
        }
    }
}
