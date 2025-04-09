import { useParams } from "next/navigation";
import { socket } from "@/libs/socket";
import { Message, User } from "@prisma/client";
import getConversationById from "@/actions/getConversationById";
import getMessage from "@/actions/getMessages";
import EmptyState from "@/components/EmptyState";
import Body from "@/components/conversations/Body";
import Form from "@/components/conversations/Form";
import Header from "@/components/conversations/Header";

interface IParams {
  conversationId: string;
}

interface FullMessage extends Message {
  sender: User;
  seenBy: { userId: string }[];
}

const ConversationId = async ({ params }: { params: IParams }) => {
  const conversations = await getConversationById(params.conversationId);
  const initialMessages = await getMessage(params.conversationId);
  console.log("initialMessages", initialMessages);
  if (!conversations) {
    return (
      <div className="lg:pl-80 h-full">
        <div className="h-full flex flex-col">
          <EmptyState />
        </div>
      </div>
    );
  }

  return (
    <div className="lg:pl-80 h-full">
      <div className="h-full flex flex-col">
        <Header conversation={conversations} />
        <Body initialMessages={initialMessages} />
        <Form />
      </div>
    </div>
  );
};
export default ConversationId;
