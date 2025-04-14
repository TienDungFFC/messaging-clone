import { useSession } from "next-auth/react";
import { useMemo } from "react";

export default function useOtherUser(conversation: { users: { user?: any }[] }) {
  const session = useSession();
  const currentUserEmail = session.data?.user?.email;

  const otherUser = useMemo(() => {
    if (!currentUserEmail || !conversation?.users?.length) return undefined;

    const users = conversation.users.map((entry) =>
      entry.user ?? entry
    );

    return users.find((user) => user.email !== currentUserEmail);
  }, [conversation.users, currentUserEmail]);

  return otherUser;
}
