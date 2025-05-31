export enum UserRole {
  ADMIN = 'Admin',
  FARMER = 'Farmer',
  BUYER = 'Buyer',
}

export enum ProductStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  CANCELLED = 'CANCELLED',
}

export enum ShippingStatus {
  NOT_SHIPPED = 'NOT_SHIPPED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
}

export enum BidStatus {
  ACTIVE = 'ACTIVE',
  OUTBID = 'OUTBID',
  WON = 'WON',
  LOST = 'LOST',
  CANCELLED = 'CANCELLED',
  CLOSED = 'CLOSED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PayoutStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum ChatType {
  FARMER_ADMIN = 'FARMER_ADMIN',
  BUYER_ADMIN = 'BUYER_ADMIN',
}