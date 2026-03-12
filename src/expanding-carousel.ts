import { getGsap, getHtmlElement, getMultipleHtmlElements } from "@taj-wf/utils";
import EmblaCarousel, { type EmblaOptionsType } from "embla-carousel";

const initExpandingCarousel = () => {
  const [gsap, Flip] = getGsap(["Flip"]);

  if (!gsap || !Flip) return;

  const mm = gsap.matchMedia();

  gsap.registerPlugin(Flip);

  /**
   * Register Embla Carousel Plugins
   */
  const allCarouselWrappers = getMultipleHtmlElements({ selector: "[exp-carousel=wrap]" });

  if (!allCarouselWrappers) return;

  for (const carouselWrap of allCarouselWrappers) {
    const carouselNode = getHtmlElement({
      selector: "[exp-carousel=trackpad]",
      parent: carouselWrap,
      log: "error",
    });

    if (!carouselNode) continue;

    const carouselContainer = carouselNode.firstElementChild as HTMLElement | null;

    if (!carouselContainer) {
      console.error(`Carousel container not found for carousel:`, carouselNode);
      continue;
    }

    const allSlideElements = (Array.from(carouselContainer.children) || []) as HTMLElement[];

    if (allSlideElements.length === 0) {
      console.error(`No slide elements found for carousel:`, carouselNode);
      continue;
    }

    const slidesLength = allSlideElements.length;

    const startIndexParsed = Number.parseInt(carouselNode.dataset.startIndex || "");
    const middleIndex = Math.floor((slidesLength - 1) / 2);
    const startIndex = Number.isNaN(startIndexParsed) ? middleIndex : startIndexParsed;

    let activeIndex = startIndex;

    const setupExpandingLogic = () => {
      const abortController = new AbortController();

      for (let slideIndex = 0; slideIndex < allSlideElements.length; slideIndex++) {
        const slide = allSlideElements[slideIndex];

        slide.addEventListener(
          "click",
          () => {
            if (activeIndex === slideIndex) return;

            const flipState = Flip.getState(allSlideElements, { props: "flex" });

            for (const otherSlide of allSlideElements) {
              otherSlide.classList.remove("is-active");
            }

            slide.classList.add("is-active");

            Flip.from(flipState, { duration: 0.4, ease: "power1.inOut", absolute: true });

            activeIndex = slideIndex;
          },
          { signal: abortController.signal }
        );
      }

      return () => {
        abortController.abort();
      };
    };

    let destroyExpandingLogic: (() => void) | null = null;

    mm.add("(max-width: 992px)", () => {
      destroyExpandingLogic?.();
    });

    mm.add("(min-width: 992px)", () => {
      destroyExpandingLogic = setupExpandingLogic();
    });
  }
};

initExpandingCarousel();
