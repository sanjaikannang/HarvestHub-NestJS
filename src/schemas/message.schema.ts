import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {

    @Prop({ type: Types.ObjectId, ref: 'Chat', required: true })
    chatId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    senderId: Types.ObjectId;

    @Prop({ type: String, required: true })
    content: string;

    @Prop({ type: [String], default: [] })
    attachments: string[];

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
    readBy: Types.ObjectId[];

}

export const MessageSchema = SchemaFactory.createForClass(Message);