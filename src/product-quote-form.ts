import { afterWebflowReady, getHtmlElement } from "@taj-wf/utils";

import { initMsForm } from "./ms-form";

const initProductQuoteDisplay = () => {
  const imageLoader = getHtmlElement({ selector: "[prod-display=loader]", log: "error" });
  const image = getHtmlElement<HTMLImageElement>({
    selector: "img[prod-display=image]",
    log: "error",
  });
  const formWrapper = getHtmlElement({ selector: "[prod-display=form-wrap]", log: "error" });

  if (!imageLoader || !image || !formWrapper) return;

  const displayContainer = imageLoader.parentElement;

  if (!displayContainer) return;

  const fragment = document.createDocumentFragment();
  const initialImageUrl = image.src;
  let currentlyDisplayedImageUrl = image.src;

  image.srcset = "";
  image.sizes = "";

  const setImage = (imageUrl: string) => {
    if (imageUrl === currentlyDisplayedImageUrl) return;

    image.src = imageUrl;

    currentlyDisplayedImageUrl = imageUrl;

    if (image.complete) {
      fragment.appendChild(imageLoader);
    } else {
      displayContainer.appendChild(imageLoader);
      image.addEventListener(
        "load",
        () => {
          fragment.appendChild(imageLoader);
        },
        { once: true }
      );
    }
  };

  const updateDisplayedImage = (radioButton: HTMLInputElement) => {
    const displayImageUrl = radioButton.getAttribute("display-image")?.trim();

    if (!displayImageUrl) return;

    setImage(displayImageUrl);
  };

  if (image.complete) {
    fragment.appendChild(imageLoader);
  } else {
    image.addEventListener(
      "load",
      () => {
        fragment.appendChild(imageLoader);
      },
      { once: true }
    );
  }

  formWrapper.addEventListener("radio-selected", (event) => {
    const radioButton = (event as CustomEvent)?.detail?.radioButton as HTMLInputElement;

    if (!radioButton) return;

    updateDisplayedImage(radioButton);
  });

  formWrapper.addEventListener("radio-deselected", (event) => {
    const formStep = (event as CustomEvent)?.detail?.prevStep as HTMLFieldSetElement | null;

    const checkedRadioButton = formStep?.querySelector<HTMLInputElement>(
      "input[type=radio]:checked"
    );

    if (!checkedRadioButton) {
      setImage(initialImageUrl);
      return;
    }

    updateDisplayedImage(checkedRadioButton);
  });

  formWrapper.addEventListener("step-changed", (event) => {
    const formStep = (event as CustomEvent)?.detail?.currentStep as HTMLFieldSetElement | null;

    if (!formStep) return;

    const checkedRadioButton = formStep.querySelector<HTMLInputElement>(
      "input[type=radio]:checked"
    );

    if (!checkedRadioButton) return;

    updateDisplayedImage(checkedRadioButton);
  });
};

afterWebflowReady(() => {
  initMsForm();
  initProductQuoteDisplay();
});
