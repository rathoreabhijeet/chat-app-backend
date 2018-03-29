import {
    Schema,
    model,
    PaginateModel,
    PaginateOptions,
    PaginateResult,
    Document
} from 'mongoose';
import * as mongoosePaginate from "mongoose-paginate";
export interface MessageInterface extends Document {
    sender_id: string;
    status: string,
    message: {
        type: string,
        information: string;
    };
    chat_room_id: string;
};

const MessageSchema = new Schema({
    sender_id: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    message: {
        type: {
            type: String,
            default: 'text',
            enum: ['text', 'image'],
        },
        information: {
            type: String,
            required: [true, 'Message cannot be empty'],
        }
    },
    chat_room_id: {
        type: Schema.Types.ObjectId,
        ref: 'ChatRoom'
    },
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'inactive'],
    },
}, { timestamps: true });
MessageSchema.plugin(mongoosePaginate);
interface MessageModel<T extends Document> extends PaginateModel<T> { };
export const Message: MessageModel<MessageInterface> = model<MessageInterface>('Message', MessageSchema) as MessageModel<MessageInterface>;