import { ChatRoom, ChatRoomInterface } from "../models/ChatRoom";
import { Message, MessageInterface } from "../models/Message";
import { Request, Response, NextFunction } from "express";
import { WriteError } from "mongodb";
import * as _ from "lodash";
import {
    Schema,
    model,
    PaginateModel,
    PaginateOptions,
    PaginateResult,
    Document
} from 'mongoose';
import * as request from "request";
/**
 * GET chat/chat_room
 * Get Existing chat room by logged in user id
 */
export let getChatRoom = (req: Request, res: Response) => {
    ChatRoom.paginate({
        user_ids: {
            $elemMatch:
                {
                    user_id: req.user._id
                }
        }
    }, {
            offset: parseInt(req.query.offset) || 0,
            limit: parseInt(req.query.limit) || 10,
            populate: 'last_message user_ids.user_id'
        }, (err: any, chat_room: PaginateResult<ChatRoomInterface>) => {
            if (err) { return res.status(400).send(err); }
            return res.status(200).send({
                chat_room: chat_room,
                msg: "Get chat_room list"
            });
        });
};

/**
 * POST chat/chat_room
 * Create a new chat_room by logged in user
 */
export let postChatRoom = (req: Request, res: Response, next: NextFunction) => {
    const errors = req.validationErrors();
    if (errors) {
        req.flash("errors", errors);
        return res.status(400).send(errors)
    }
    ChatRoom.findOne({
        $and: [{
            user_ids: {
                $elemMatch:
                    {
                        user_id: req.user._id
                    }
            }
        }, {
            user_ids: {
                $elemMatch:
                    {
                        user_id: req.body.reciver_id
                    }
            }
        }]
    }, (err, chat_room: any) => {
        if (err) { return res.status(400).send(err); }
        if (!chat_room) {
            const new_chat_room = new ChatRoom({
                user_ids: [{
                    user_id: req.user._id,
                    is_online: true
                }, {
                    user_id: req.body.reciver_id,
                    is_online: false
                }]
            });
            new_chat_room.save((err: any) => {
                if (err) { return res.status(400).send(err); }
                res.status(200).send({
                    chat_room: new_chat_room,
                    msg: 'ChatRoom added successfully.'
                });
            });
        } else {
            res.status(200).send({
                chat_room: chat_room,
                msg: 'ChatRoom added successfully.'
            });
        }
    })
};