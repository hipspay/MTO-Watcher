export interface IRequest {
    address: string;
    id: number;
    role: 'merchant' | 'customer';
}

export interface IBaseFilterQuery {
    page: string;
    limit: string;
    order: 'DESC' | 'ASC';
    sortBy: string;
}
