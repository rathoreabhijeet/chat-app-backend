import { Socket } from 'socket.io';
import { ChatRoom, ChatRoomInterface } from "../models/ChatRoom";
import { Message, MessageInterface } from "../models/Message";
import * as _ from "lodash";
/**
 * GET /
 * Initilize Socket IO
 */
export let initSocket = (io: any) => {
    /* Before socket connection */
    io.use((socket: Socket, next: Function) => {
        next();
    });
    /* After socket connection */
    io.sockets.on('connection', (socket: Socket, chat_rooms: any) => {
        var handshakeData = socket.request;
        /* Update logged in user online status on after connection */
        if (handshakeData && handshakeData._query) {
            ChatRoom.find({
                user_ids: {
                    $elemMatch:
                        {
                            user_id: handshakeData._query.user_id
                        }
                }
            }).populate('last_message user_ids.user_id').exec((err, chat_rooms: any) => {
                if (err) { return console.log('error in chat_room find at disconnect') }
                chat_rooms.forEach((chat_room: any) => {
                    let currentUserIndex = _.findIndex(chat_room.user_ids, (user: any) => {
                        return user.user_id._id.toString() === handshakeData._query.user_id
                    });
                    if (currentUserIndex !== -1) {
                        chat_room.user_ids[currentUserIndex].is_online = true;
                    }
                    chat_room.save((err: any) => {
                        if (err) { return console.log('error in chat_room update at disconnect') }
                        chat_room.user_ids.forEach((user: any) => {
                            if (user.user_id)
                                io.sockets.in(user.user_id._id).emit('update-chat', chat_room);
                        });
                    });
                });
            });
            /* Join different socket using user id */
            socket.join(handshakeData._query.user_id);
            /* Soket Send message istener
             * Save new message in database
             * Update chat room last message
             * Send acknowledgement chat event to sender id
             * Send update message list to reciver id
             */
            socket.on('send-message', (new_message: any) => {
                const message = new Message({
                    sender_id: handshakeData._query.user_id,
                    message: {
                        type: new_message.type,
                        information: new_message.information
                    },
                    chat_room_id: new_message.chat_room_id
                });
                message.save((err, doc: MessageInterface) => {
                    if (err) {
                        return io.sockets.in(socket.id).emit('acknowledgement-chat', {
                            is_success: false
                        });
                    }
                    ChatRoom.findById(new_message.chat_room_id).populate('last_message user_ids.user_id').exec((err, chat_room: ChatRoomInterface) => {
                        if (err) {
                            return io.sockets.in(socket.id).emit('acknowledgement-chat', {
                                is_success: false
                            });
                        }
                        chat_room.user_ids.forEach((user: any) => {
                            if (Object.keys(io.sockets.in(handshakeData._query.user_id).connected).length)
                                user.is_online = true
                        });
                        chat_room.last_message = doc._id;
                        chat_room.save((err) => {
                            if (err) {
                                return io.sockets.in(socket.id).emit('acknowledgement-chat', {
                                    is_success: false
                                });
                            }
                            let new_chat_room: any = Object.assign({}, chat_room);
                            new_chat_room._doc.last_message = message;
                            new_chat_room._doc.is_new = true;
                            chat_room.user_ids.forEach((user: any) => {
                                if (user.user_id)
                                    io.sockets.in(user.user_id._id).emit('update-chat', new_chat_room._doc);
                            });
                            io.sockets.in(socket.id).emit('acknowledgement-chat', {
                                is_success: true
                            });
                        });
                    });
                });
            });
            /* Socket logout istener 
             * Send acknowledgement of logout to other online socket window of logout user
            */
            socket.on('logout', () => {
                io.sockets.in(handshakeData._query.user_id).emit('acknowledgement-logout', {
                    is_logout: true
                });
            });
            /* Socket disconnect
             * Update user online status after all socket of user are disconnected
            */
            socket.on('disconnect', () => {
                if (!Object.keys(io.sockets.in(handshakeData._query.user_id).connected).length) {
                    ChatRoom.find({
                        user_ids: {
                            $elemMatch:
                                {
                                    user_id: handshakeData._query.user_id
                                }
                        }
                    }).populate('last_message user_ids.user_id').exec((err, chat_rooms: any) => {
                        if (err) { return console.log('error in chat_room find at disconnect') }
                        chat_rooms.forEach((chat_room: any) => {

                            let currentUserIndex = _.findIndex(chat_room.user_ids, (user: any) => {
                                return user.user_id._id.toString() === handshakeData._query.user_id
                            });
                            if (currentUserIndex !== -1) {
                                chat_room.user_ids[currentUserIndex].is_online = false;
                            }
                            chat_room.save((err: any) => {
                                if (err) { return console.log('error in chat_room update at disconnect') }
                                chat_room.user_ids.forEach((user: any) => {
                                    if (user.user_id !== handshakeData._query.user_id)
                                        io.sockets.in(user.user_id).emit('update-chat', chat_room);
                                });

                            });
                        });
                    });
                }
                /* Leave different socket using user id */
                socket.leave(handshakeData._query.user_id);
            });
        }
    });
};
