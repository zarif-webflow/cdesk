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
  let currentlyDisplayedImageUrl = image.src;

  const updateDisplayedImage = (radioButton: HTMLInputElement) => {
    const displayImageUrl = radioButton.getAttribute("display-image")?.trim();

    if (!displayImageUrl) return;

    if (displayImageUrl === currentlyDisplayedImageUrl) return;

    displayContainer.appendChild(imageLoader);

    image.src = displayImageUrl;

    currentlyDisplayedImageUrl = displayImageUrl;

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
