import {
    Schema,
    model,
    PaginateModel,
    PaginateOptions,
    PaginateResult,
    Document
} from 'mongoose';
import * as mongoosePaginate from "mongoose-paginate";
export interface ChatRoomInterface extends Document {
    user_ids: Array<{
        user_id: string,
        is_online: boolean
    }>;
    status: string,
    last_message: string;
};

const ChatRoomSchema = new Schema({
    user_ids: [{
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        is_online: Boolean
    }],
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'inactive'],
    },
    type: {
        type: String,
        default: 'user',
        enum: ['user', 'group'],
    },
    last_message: {
        type: Schema.Types.ObjectId,
        ref: 'Message'
    }
}, { timestamps: true });
ChatRoomSchema.plugin(mongoosePaginate);
interface ChatRoomModel<T extends Document> extends PaginateModel<T> { };
export const ChatRoom: ChatRoomModel<ChatRoomInterface> = model<ChatRoomInterface>('ChatRoom', ChatRoomSchema) as ChatRoomModel<ChatRoomInterface>;