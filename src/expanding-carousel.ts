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

    let destroyExpandingLogic: (() => void) | null = null;
    let destroyCarousel: (() => void) | null = null;

    const setActiveSlide = (slideIndex: number) => {
      const slide = allSlideElements[slideIndex];

      for (const otherSlide of allSlideElements) {
        otherSlide.classList.remove("is-active");
      }

      slide.classList.add("is-active");
    };

    const setupExpandingLogic = () => {
      const abortController = new AbortController();

      for (let slideIndex = 0; slideIndex < allSlideElements.length; slideIndex++) {
        const slide = allSlideElements[slideIndex];

        // Make slide focusable
        slide.setAttribute("tabindex", "0");

        const handleActivation = () => {
          if (activeIndex === slideIndex) return;

          const flipState = Flip.getState(allSlideElements, { props: "flex" });

          setActiveSlide(slideIndex);

          Flip.from(flipState, { duration: 0.4, ease: "power1.inOut", absolute: true });

          activeIndex = slideIndex;
        };

        slide.addEventListener("click", handleActivation, { signal: abortController.signal });

        slide.addEventListener(
          "keydown",
          (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleActivation();
            }
          },
          { signal: abortController.signal }
        );
      }

      return () => {
        abortController.abort();
      };
    };

    const setupCarousel = () => {
      const options: EmblaOptionsType = {
        loop: true,
        align: "center",
        startIndex: activeIndex,
        slides: allSlideElements,
      };

      const emblaApi = EmblaCarousel(carouselNode, options);

      emblaApi.on("select", () => {
        const selectedSlideIndex = emblaApi.selectedScrollSnap();

        if (selectedSlideIndex === activeIndex) return;

        setActiveSlide(selectedSlideIndex);

        activeIndex = selectedSlideIndex;
      });

      return () => {
        emblaApi.destroy();
      };
    };

    mm.add("(max-width: 992px)", () => {
      destroyExpandingLogic?.();
      destroyExpandingLogic = null;

      destroyCarousel = setupCarousel();
    });

    mm.add("(min-width: 993px)", () => {
      destroyCarousel?.();
      destroyCarousel = null;

      destroyExpandingLogic = setupExpandingLogic();
    });
  }
};

initExpandingCarousel();
