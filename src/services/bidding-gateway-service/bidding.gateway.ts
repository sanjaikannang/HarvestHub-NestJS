import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { UserRole } from 'src/utils/enum';
import { BidService } from '../bid-service/bid.service';
import { UserService } from '../user-service/user.service';
import { ProductRepositoryService } from 'src/repositories/product-repository/product.repository';
import { ConfigService } from 'src/config/config.service';
import { UserRepositoryService } from 'src/repositories/user-repository/user.repository';
import { PlaceBidRequest } from 'src/api/bid/place-bid/place-bid.request';

interface JwtPayloadWithRole extends jwt.JwtPayload {
    role: UserRole;
    sub?: string;
    userId?: string;
}

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})

export class BiddingGateway implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer()
    server: Server;

    // Track connected clients and their room subscriptions
    private connectedClients: Map<string, { userId: string; role: UserRole }> = new Map();

    constructor(
        private readonly bidService: BidService,
        private readonly productRepositoryService: ProductRepositoryService,
        private readonly userRepositoryService: UserRepositoryService,
        private readonly userService: UserService,
        private readonly configService: ConfigService,
    ) { }


    // Handle Connection
    async handleConnection(client: Socket) {
        try {
            // Extract and verify JWT token from handshake
            const token = client.handshake.auth.token;
            if (!token) {
                console.log('No token provided, disconnecting client');
                client.disconnect();
                return;
            }

            try {

                // Verify the JWT token using your existing logic
                const payload = jwt.verify(
                    token,
                    this.configService.getJWTSecretKey()
                ) as JwtPayloadWithRole;

                // Extract user ID from payload
                const userId = payload.sub || payload.userId;

                if (!userId) {
                    console.log('Invalid token payload (no user ID), disconnecting client');
                    client.disconnect();
                    return;
                }

                // Find the user in the database
                const user = await this.userRepositoryService.findById(userId);

                if (!user) {
                    console.log('User not found, disconnecting client');
                    client.disconnect();
                    return;
                }

                // Store client information
                this.connectedClients.set(client.id, {
                    userId: (user as { _id: { toString(): string } })._id.toString(),
                    role: payload.role // Using role from token
                });

                console.log(`Client connected: ${client.id} (User: ${user._id}, Role: ${payload.role})`);

            } catch (jwtError) {

                console.error('Token verification failed:', jwtError.message);
                client.disconnect();
                return;

            }

        } catch (error) {
            console.error('Connection error:', error);
            client.disconnect();
        }
    }



    // Handle Disconnect
    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
        this.connectedClients.delete(client.id);
    }



    // Handle join auction 
    @SubscribeMessage('joinAuction')
    async handleJoinAuction(
        @ConnectedSocket() client: Socket,
        @MessageBody() productId: string
    ) {
        const clientInfo = this.connectedClients.get(client.id);
        if (!clientInfo) {
            client.emit('error', { message: 'Authentication required' });
            return;
        }

        try {
            // Verify product exists
            const product = await this.productRepositoryService.findProductById(productId);
            if (!product) {
                client.emit('error', { message: 'Product not found' });
                return;
            }

            // Check if auction is active
            const now = new Date();
            if (now < product.bidStartDate || now > product.bidEndDate) {
                client.emit('error', { message: 'Auction is not active' });
                return;
            }

            // Join the room for this auction
            const roomName = `auction-${productId}`;
            client.join(roomName);

            // Send current auction state to the client
            const auctionData = await this.bidService.getAuctionState(productId);
            client.emit('auctionState', auctionData);

            console.log(`User ${clientInfo.userId} joined auction room for product ${productId}`);
        } catch (error) {
            console.error('Error joining auction:', error);
            client.emit('error', { message: 'Failed to join auction' });
        }
    }



    // Handle leave auction
    @SubscribeMessage('leaveAuction')
    handleLeaveAuction(
        @ConnectedSocket() client: Socket,
        @MessageBody() productId: string
    ) {
        const roomName = `auction-${productId}`;
        client.leave(roomName);
        console.log(`Client ${client.id} left auction room for product ${productId}`);
    }



    // Handle place bid
    @SubscribeMessage('placeBid')
    async handlePlaceBid(
        @ConnectedSocket() client: Socket,
        @MessageBody() placeBidRequest: PlaceBidRequest
    ) {
        const clientInfo = this.connectedClients.get(client.id);
        if (!clientInfo) {
            client.emit('error', { message: 'Authentication required' });
            return;
        }

        // Only buyers can place bids
        if (clientInfo.role !== UserRole.BUYER) {
            client.emit('error', { message: 'Only buyers can place bids' });
            return;
        }

        try {
            const { productId, bidAmount } = placeBidRequest;

            // Create the bid with the actual user ID from the authenticated connection
            const newBid = await this.bidService.placeBid({
                productId,
                bidderId: clientInfo.userId,
                bidAmount,
                bidTime: new Date(),
            });

            if (newBid.error) {
                client.emit('bidError', { message: newBid.error });
                return;
            }

            // Get updated auction state
            const updatedAuctionState = await this.bidService.getAuctionState(productId);

            // Broadcast the updated state to all clients in the auction room
            const roomName = `auction-${productId}`;
            this.server.to(roomName).emit('auctionUpdate', updatedAuctionState);

            // Notify the bidder of successful bid
            client.emit('bidPlaced', {
                success: true,
                bid: newBid
            });
        } catch (error) {
            console.error('Error placing bid:', error);
            client.emit('bidError', { message: 'Failed to place bid' });
        }
    }



    // Method to broadcast auction updates (can be called from other services)
    public broadcastAuctionUpdate(productId: string, auctionData: any) {
        const roomName = `auction-${productId}`;
        this.server.to(roomName).emit('auctionUpdate', auctionData);
    }
}