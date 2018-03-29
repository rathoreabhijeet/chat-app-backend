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
 * GET message/
 * Get messgae list of select room id of logged in user
 */
export let getMessage = (req: Request, res: Response) => {
    Message.paginate({
        chat_room_id: req.params.chat_room_id
    }, {
            offset: parseInt(req.query.offset) || 0,
            limit: parseInt(req.query.limit) || 10
        }, (err: any, messages: PaginateResult<MessageInterface>) => {
            if (err) { return res.status(400).send(err); }
            return res.status(200).send({
                messages: messages,
                msg: "Get message list"
            });
        });
};

/**
 * POST message/
 * Create a new message.
 */
export let postMessage = (req: Request, res: Response, next: NextFunction) => {
    const errors = req.validationErrors();
    if (errors) {
        req.flash("errors", errors);
        return res.status(400).send(errors)
    }
    const message = new Message(req.body);
    message.save((err) => {
        if (err) { return res.status(400).send(err); }
        res.status(200).send({
            message: message,
            msg: 'Message added successfully.'
        });
    });
};