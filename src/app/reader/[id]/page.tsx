import Reader from "y/app/reader/[id]/reader";
import { getBookToc } from "y/server/service/book";
import { prisma } from "y/server/db";
import { redirect } from "next/navigation";
import groupBy from "lodash/groupBy";
import { MarkType } from "y/utils/constants";
import { auth } from "y/server/wrapAppRouter";

export default async function Page(props: { params: { id: string } }) {
  const session = await auth();

  const userId = session.user.id;
  const bookId = Number.parseInt(props.params.id);
  const book = await prisma.book.findFirst({
    where: {
      userId,
      id: bookId,
    },
  });
  if (!book) {
    redirect("/bookshelf");
  }
  const tocData = await getBookToc(book);

  const marks = await prisma.mark.findMany({
    where: {
      userId,
      bookId,
    },
  });

  const groups = groupBy(marks, "type");

  return (
    <Reader
      id={book.id}
      title={book.title}
      contentPath={book.contentPath}
      current={book.current}
      fileName={book.fileName}
      tocData={tocData}
      highlights={groups[MarkType.Highlight] ?? []}
      bookmarks={groups[MarkType.Bookmark] ?? []}
    />
  );
}
