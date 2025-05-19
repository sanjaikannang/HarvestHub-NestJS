import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ChatType } from 'src/utils/enum';

export type ChatDocument = Chat & Document;

@Schema({ timestamps: true })
export class Chat {

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true })
    participants: Types.ObjectId[];

    @Prop({ type: String, enum: ChatType, required: true })
    chatType: ChatType;

    @Prop({ type: Date })
    lastMessageAt: Date;

}

export const ChatSchema = SchemaFactory.createForClass(Chat);