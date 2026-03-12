import { getHtmlElement, getMultipleHtmlElements } from "@taj-wf/utils";
import EmblaCarousel, { type EmblaOptionsType } from "embla-carousel";

const initHeroCarousel = () => {
  const allCarouselWrappers = getMultipleHtmlElements({ selector: "[hero-carousel=wrap]" });

  if (!allCarouselWrappers) return;

  for (const carouselWrap of allCarouselWrappers) {
    const carouselNode = getHtmlElement({
      selector: "[hero-carousel=trackpad]",
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

    const options: EmblaOptionsType = {
      loop: true,
      align: "center",
      startIndex: startIndex,
      slides: allSlideElements,
    };

    const emblaApi = EmblaCarousel(carouselNode, options);

    const setActiveSlide = (slideIndex: number) => {
      for (let i = 0; i < allSlideElements.length; i++) {
        const slide = allSlideElements[i];

        const otherClassTrigElements = getMultipleHtmlElements({
          selector: "[hero-carousel=trig-active-class]",
          log: "error",
          parent: slide,
        });

        if (i === slideIndex) {
          slide.classList.add("is-active");
          otherClassTrigElements?.forEach((el) => el.classList.add("is-active"));
        } else {
          slide.classList.remove("is-active");
          otherClassTrigElements?.forEach((el) => el.classList.remove("is-active"));
        }
      }
    };

    emblaApi.on("select", () => {
      const selectedSlideIndex = emblaApi.selectedScrollSnap();
      setActiveSlide(selectedSlideIndex);
    });

    const nextButtons = getMultipleHtmlElements({
      selector: "[carousel-next]",
      parent: carouselWrap,
    });
    const prevButtons = getMultipleHtmlElements({
      selector: "[carousel-prev]",
      parent: carouselWrap,
    });

    nextButtons?.forEach((btn) => {
      btn.addEventListener("click", () => {
        emblaApi.scrollNext();
      });
    });

    prevButtons?.forEach((btn) => {
      btn.addEventListener("click", () => {
        emblaApi.scrollPrev();
      });
    });
  }
};

initHeroCarousel();
