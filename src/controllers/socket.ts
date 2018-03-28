import { Socket } from 'socket.io';
import { ChatRoom, ChatRoomInterface } from "../models/ChatRoom";
import { Message, MessageInterface } from "../models/Message";
import * as _ from "lodash";
/**
 * GET /
 * Initilize Socket IO
 */
export let initSocket = (io: any) => {
    // Before socket connection
    io.use((socket: Socket, next: Function) => {

    });
    // After socket connection
    io.sockets.on('connection', (socket: Socket, chat_rooms: any) => {
        console.log('chat_rooms', chat_rooms)
        var handshakeData = socket.request;
        if (handshakeData && handshakeData._query) {
            ChatRoom.find({
                user_ids: {
                    $elemMatch:
                        {
                            user_id: handshakeData._query.user_id
                        }
                }
            }, (err, chat_rooms: any) => {
                if (err) { return console.log('error in chat_room find at disconnect') }
                chat_rooms.forEach((chat_room: any) => {
                    let currentUserIndex = _.findIndex(chat_room.user_ids, ['user_id', handshakeData._query.user_id]);
                    if (currentUserIndex !== -1) {
                        chat_room.user_ids[currentUserIndex].is_online = true;
                    }
                    chat_room.save((err: any) => {
                        if (err) { return console.log('error in chat_room update at disconnect') }
                        chat_room.user_ids.forEach((user: any) => {
                            if (user.user_id !== handshakeData._query.user_id)
                                io.sockets.in(user.user_id).emit('update-chat', chat_room);
                        });
                    });
                });
               // io.sockets.in(socket.id).emit('get-list', chat_rooms);
                console.log('yesa')
            });
            // Join different socket using user id
            console.log('handshakeData._query.user_id', handshakeData._query.user_id)
            socket.join(handshakeData._query.user_id);
            // Send message listener
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
                    if (err) { return console.log('error in message save') }
                    ChatRoom.findById(new_message.chat_room_id, (err, chat_room: ChatRoomInterface) => {
                        if (err) { return console.log('error in chat_room find') }
                        chat_room.last_message = doc._id;
                        chat_room.save((err) => {
                            if (err) { return console.log('error in chat_room update') }
                            chat_room.user_ids.forEach((user) => {
                                io.sockets.in(user.user_id).emit('update-chat', chat_room);
                            });
                        });
                    });
                });
            });

            socket.on('disconnect', () => {
                if (!Object.keys(io.sockets.in(handshakeData._query.user_id).connected).length) {
                    ChatRoom.find({
                        user_ids: {
                            $elemMatch:
                                {
                                    user_id: handshakeData._query.user_id
                                }
                        }
                    }, (err, chat_rooms: any) => {
                        if (err) { return console.log('error in chat_room find at disconnect') }
                        chat_rooms.forEach((chat_room: any) => {
                            let currentUserIndex = _.findIndex(chat_room.user_ids, ['user_id', handshakeData._query.user_id]);
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
                socket.leave(handshakeData._query.user_id);
            });
        }
    });
};
