import Bookshelf from "y/app/bookshelf/Bookshelf";
import { auth } from "y/server/wrapAppRouter";

export default async function Page() {
  await auth();

  return <Bookshelf />;
}
