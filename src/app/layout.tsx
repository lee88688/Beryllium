import { type PropsWithChildren } from "react";
import AppProvider from "y/app/appProvider";

export default function Layout(props: PropsWithChildren) {
  return (
    <html lang="en">
      <body>
        <AppProvider>{props.children}</AppProvider>
      </body>
    </html>
  );
}
