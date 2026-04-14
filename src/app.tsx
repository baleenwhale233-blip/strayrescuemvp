import type { PropsWithChildren } from "react";
import { initCloudBase } from "./domain/canonical/repository/cloudbaseClient";
import "./app.scss";

export default function App({ children }: PropsWithChildren) {
  initCloudBase();

  return children;
}
