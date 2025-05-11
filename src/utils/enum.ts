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