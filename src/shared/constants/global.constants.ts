export enum OrderStatus {
    IN_DELIVERY = 'in_delivery',
    OVER_DELIVERY = 'over_delivery',
    COMPLETED = 'completed',
    IN_DISPUTE = 'in_dispute',
}

export enum DisputeStatus {
    INIT = 'init',
    WAITING = 'waiting',
    REVIEW = 'review',
    FAIL = 'fail',
    WIN = 'win',
}

export enum AgentStatus {
    INIT = 'init',
    WAITING = 'waiting',
    REVIEW = 'review',
    PENDING_01 = 'pending_approved',
    PENDING_02 = 'pending_disapproved',
    EARNED = 'earned',
    LOST = 'lost',
    BAN = 'ban',
}
