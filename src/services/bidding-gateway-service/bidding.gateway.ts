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
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BidService } from './bid.service';
import { ProductService } from '../product/product.service';
import { UserService } from '../user/user.service';
import { BidDto } from './dto/bid.dto';
import { UserRole } from 'src/utils/enum';

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
    private bidService: BidService,
    private productService: ProductService,
    private userService: UserService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Extract and verify JWT token from handshake
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      // Verify token and get user information
      // Note: You'll need to implement a token verification method
      const user = await this.userService.verifyToken(token);
      if (!user) {
        client.disconnect();
        return;
      }

      // Store client information
      this.connectedClients.set(client.id, { 
        userId: user._id.toString(), 
        role: user.role 
      });

      console.log(`Client connected: ${client.id} (User: ${user._id}, Role: ${user.role})`);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

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
      const product = await this.productService.findById(productId);
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

  @SubscribeMessage('leaveAuction')
  handleLeaveAuction(
    @ConnectedSocket() client: Socket,
    @MessageBody() productId: string
  ) {
    const roomName = `auction-${productId}`;
    client.leave(roomName);
    console.log(`Client ${client.id} left auction room for product ${productId}`);
  }

  @SubscribeMessage('placeBid')
  async handlePlaceBid(
    @ConnectedSocket() client: Socket,
    @MessageBody() bidData: BidDto
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
      const { productId, bidAmount } = bidData;
      
      // Create the bid with the actual user ID from the authenticated connection
      const newBid = await this.bidService.createBid({
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

  // Admin-only method to manually end an auction
  @SubscribeMessage('adminEndAuction')
  async handleAdminEndAuction(
    @ConnectedSocket() client: Socket,
    @MessageBody() productId: string
  ) {
    const clientInfo = this.connectedClients.get(client.id);
    if (!clientInfo || clientInfo.role !== UserRole.ADMIN) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    try {
      const result = await this.bidService.endAuction(productId);
      const roomName = `auction-${productId}`;
      this.server.to(roomName).emit('auctionEnded', result);
    } catch (error) {
      console.error('Error ending auction:', error);
      client.emit('error', { message: 'Failed to end auction' });
    }
  }

  // Method to broadcast auction updates (can be called from other services)
  public broadcastAuctionUpdate(productId: string, auctionData: any) {
    const roomName = `auction-${productId}`;
    this.server.to(roomName).emit('auctionUpdate', auctionData);
  }
}