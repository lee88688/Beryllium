import Setting from "y/app/setting/setting";
import { auth } from "y/server/wrapAppRouter";
import { prisma } from "y/server/db";
import pick from "lodash/pick";

export default async function Page() {
  const session = await auth();
  const user = await prisma.user.findFirst({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });

  let usersData = [] as { id: number; username: string; isAdmin: boolean }[];
  if (user?.isAdmin) {
    const users = await prisma.user.findMany({});

    usersData = users.map((item) => pick(item, "id", "username", "isAdmin"));
  }

  return <Setting isAdmin={user?.isAdmin ?? false} usersData={usersData} />;
}
