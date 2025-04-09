import { Message, Room, User } from "@prisma/client";

export type FullMessageType = Message & {
  sender: User;
  seen: User[];
};

export type FullRoomType = Room & {
  users: User[];
  messages: FullMessageType[];
};
