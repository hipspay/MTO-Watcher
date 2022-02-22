import { Service } from 'typedi';
import {
    Between,
    getRepository,
    LessThanOrEqual,
    MoreThanOrEqual,
    ILike,
} from 'typeorm';

import { Products } from '../entities/Products';
import { IProductFilterQuery } from '../shared/types/product.types';

@Service()
export default class ProductService {
    private getFilter(query: IProductFilterQuery) {
        const { fromPrice, toPrice, shopAddress, name } = query;

        let filter = {};

        if (name) {
            filter = { name: ILike(`%${name}%`) };
        }

        if (shopAddress) {
            filter = { ...filter, shopAddress: ILike(`%${shopAddress}%`) };
        }

        if (fromPrice && toPrice) {
            filter = { ...filter, price: Between(+fromPrice, +toPrice) };
        } else if (toPrice) {
            filter = { ...filter, price: LessThanOrEqual(+toPrice) };
        } else if (fromPrice) {
            filter = { ...filter, price: MoreThanOrEqual(+fromPrice) };
        }

        return filter;
    }

    public async createProduct(createProductData: Products): Promise<Products> {
        return await getRepository(Products).save(createProductData);
    }

    public async updateProduct(
        id: number,
        updateProductData: Products
    ): Promise<Products> {
        const productRepository = getRepository(Products);

        await productRepository.update(id, updateProductData);
        return productRepository.findOne(id);
    }

    public async removeProduct(merchantId: number, id: number): Promise<any> {
        return getRepository(Products)
            .createQueryBuilder()
            .delete()
            .where('merchant = :merchantId', { merchantId })
            .andWhere('id = :id', { id })
            .execute();
    }

    public async getProducts(
        query: IProductFilterQuery
    ): Promise<{ totalCount: number; products: Products[] }> {
        const { page, limit, sortBy, order } = query;
        const filter = this.getFilter(query);

        const totalCount = await getRepository(Products).count({
            where: filter,
        });

        const products = await getRepository(Products).find({
            where: filter,
            order: {
                [sortBy ? sortBy : 'id']: order ? order : 'ASC',
            },
            skip: (+page - 1) * +limit,
            take: +limit,
        });

        return { totalCount, products };
    }

    public async getProductsByMerchant(
        merchantId: number,
        query: IProductFilterQuery
    ): Promise<{ totalCount: number; products: Products[] }> {
        const { page, limit, sortBy, order } = query;
        const filter = { merchant: merchantId, ...this.getFilter(query) };

        const totalCount = await getRepository(Products).count({
            where: { merchant: merchantId },
        });

        const products = await getRepository(Products).find({
            where: filter,
            order: {
                [sortBy ? sortBy : 'id']: order ? order : 'ASC',
            },
            skip: (+page - 1) * +limit,
            take: +limit,
        });

        return { totalCount, products };
    }

    public async getProductById(id: number): Promise<Products> {
        return await getRepository(Products).findOne(id, {
            relations: ['merchant'],
        });
    }

    public async getProductByMerchantById(
        merchantId: number,
        id: number
    ): Promise<Products> {
        return await getRepository(Products).findOne({
            where: {
                id: id,
                merchant: merchantId,
            },
        });
    }
}
