/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { parseStringPromise } from 'xml2js'

type NavPoint = {
  navLabel: any[];
  content: any[];
  navPoint: any[];
};

type TocItem = {
  label: string;
  src: string;
  children?: TocItem[];
};

function parseNavPoint(point: NavPoint) {
  const item: TocItem = {
    label: "",
    src: "",
  };
  const { navLabel, content, navPoint } = point;
  item.label = navLabel
    .map((label) => {
      const { text } = label;
      return text.map((t) => (t._ ? t._ : t)).join(", ");
    })
    .join(", ");
  item.src = content[0].$.src;
  if (navPoint) {
    item.children = navPoint.map(parseNavPoint);
  }
  return item;
}

export async function parseNcx(ncxString: string) {
  if (!ncxString) return;
  const { ncx } = await parseStringPromise(ncxString);
  // parse navMap and navList, currently, only parse navMap
  const navMap = ncx.navMap[0];
  const toc = navMap.navPoint.map(parseNavPoint);
  return toc;
}

export async function parseToc(tocString: string): Promise<unknown> {
  // todo: suport epub3 Navigation Document
  return parseNcx(tocString);
}
