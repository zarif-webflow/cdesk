import { afterWebflowReady } from "@taj-wf/utils";

import { initMsForm } from "./ms-form";

afterWebflowReady(() => {
  initMsForm();
});
