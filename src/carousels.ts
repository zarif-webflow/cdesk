import { afterWebflowReady } from "@taj-wf/utils";

import { initExpandingCarousel } from "./expanding-carousel";
import { initHeroCarousel } from "./hero-carousel";

afterWebflowReady(() => {
  initHeroCarousel();
  initExpandingCarousel();
});
