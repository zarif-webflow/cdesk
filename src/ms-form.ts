import { getGsap, getHtmlElement, getMultipleHtmlElements } from "@taj-wf/utils";

const initMsForm = () => {
  const [gsap, Flip] = getGsap(["Flip"]);

  if (!gsap || !Flip) {
    console.error("GSAP or Flip plugin is missing");
    return;
  }

  const formWrappers = getMultipleHtmlElements({ selector: "[ms-form=wrap]" });

  if (!formWrappers) return;

  for (const formWrapper of formWrappers) {
    const form = getHtmlElement<HTMLFormElement>({
      selector: "form",
      parent: formWrapper,
      log: "error",
    });

    if (!form) continue;

    const nextButton = getHtmlElement({
      selector: "[ms-form=next]",
      parent: formWrapper,
      log: "error",
    });
    const prevButton = getHtmlElement({
      selector: "[ms-form=prev]",
      parent: formWrapper,
      log: "error",
    });
    const submitButtonOriginal = getHtmlElement({
      selector: "[ms-form=submit]",
      parent: formWrapper,
      log: "error",
    });

    if (!nextButton || !prevButton || !submitButtonOriginal) continue;

    const allFormSteps = getMultipleHtmlElements<HTMLFieldSetElement>({
      selector: "fieldset[ms-form-step]",
      parent: form,
      log: "error",
    });

    if (!allFormSteps) continue;

    const submitButton = submitButtonOriginal.cloneNode(true) as HTMLButtonElement;

    submitButton.type = "button";

    submitButtonOriginal.replaceWith(submitButton);

    const formStepsMap = new Map<string, HTMLFieldSetElement>();

    let currentStep: HTMLFieldSetElement | null = null;

    for (const formStep of allFormSteps) {
      const stepId = formStep.getAttribute("ms-form-step");

      if (!stepId) {
        console.error("Missing step id for form step", formStep);
        break;
      }

      if (stepId === "first") {
        currentStep = formStep;
      } else if (stepId !== "final") {
        formStep.disabled = true;
      }

      formStepsMap.set(stepId, formStep);
    }

    if (!currentStep) {
      console.error("Missing first step for form", form);
      continue;
    }

    const formStepsWrapper = currentStep.parentElement!;

    const stepsHistory = [currentStep];

    const animateToNextStep = ({
      currentStep,
      nextStep,
    }: {
      currentStep: HTMLFieldSetElement;
      nextStep: HTMLFieldSetElement;
    }) => {
      gsap.fromTo(
        currentStep,
        { opacity: 1, x: 0 },
        {
          opacity: 0,
          duration: 0.2,
          x: -20,
          ease: "power1.inOut",
          onComplete: () => {
            const flipState = Flip.getState(formStepsWrapper, { props: "height" });

            currentStep.style.display = "none";
            nextStep.style.display = "block";

            Flip.from(flipState, {
              duration: 0.2,
              ease: "power1.inOut",
            });

            gsap.fromTo(
              nextStep,
              { opacity: 0, x: 20 },
              { opacity: 1, duration: 0.2, x: 0, ease: "power1.inOut" }
            );
          },
        }
      );
    };

    const animateToPrevStep = ({
      currentStep,
      prevStep,
    }: {
      currentStep: HTMLFieldSetElement;
      prevStep: HTMLFieldSetElement;
    }) => {
      gsap.fromTo(
        currentStep,
        { opacity: 1, x: 0 },
        {
          opacity: 0,
          duration: 0.2,
          x: 20,
          ease: "power1.inOut",
          onComplete: () => {
            const flipState = Flip.getState(formStepsWrapper, { props: "height" });

            currentStep.style.display = "none";
            prevStep.style.display = "block";

            Flip.from(flipState, {
              duration: 0.2,
              ease: "power1.inOut",
            });

            gsap.fromTo(
              prevStep,
              { opacity: 0, x: -20 },
              { opacity: 1, duration: 0.2, x: 0, ease: "power1.inOut" }
            );
          },
        }
      );
    };

    const goToNextStep = ({ nextStepId }: { nextStepId: string }) => {
      if (!currentStep) return;

      const nextStep = formStepsMap.get(nextStepId);

      if (!nextStep) {
        console.error("Missing next step with id", nextStepId, "for form", form);
        return;
      }

      animateToNextStep({ currentStep, nextStep });

      nextStep.disabled = false;

      stepsHistory.push(nextStep);
      currentStep = nextStep;

      adjustControlButtons();
    };

    const goToPrevStep = () => {
      if (!currentStep) return;

      if (stepsHistory.length < 2) return;

      const prevStep = stepsHistory.at(-2)!;

      animateToPrevStep({ currentStep, prevStep });

      if (currentStep.getAttribute("ms-form-step") !== "final") {
        currentStep.disabled = true;
      }

      stepsHistory.pop();
      currentStep = prevStep;

      adjustControlButtons();
    };

    const handleInputValidation = ({ formStep }: { formStep: HTMLElement }) => {
      const formStepInputs = Array.from(
        formStep.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
          "input, select, textarea"
        )
      );

      const firstInvalidInput = formStepInputs.find((input) => !input.checkValidity());

      if (!firstInvalidInput) return true;

      firstInvalidInput.reportValidity();

      return false;
    };

    const canGoToNext = () => {
      if (!currentStep) return false;
      if (currentStep.getAttribute("ms-form-step") === "final") return false;
      return true;
    };

    const canGoToPrev = () => {
      if (!currentStep) return false;
      if (currentStep.getAttribute("ms-form-step") === "first") return false;
      return true;
    };

    const adjustControlButtons = () => {
      if (canGoToNext()) {
        nextButton.classList.remove("is-disabled");
      } else {
        nextButton.classList.add("is-disabled");
      }

      if (canGoToPrev()) {
        prevButton.classList.remove("is-disabled");
      } else {
        prevButton.classList.add("is-disabled");
      }
    };

    const handleNext = () => {
      if (!currentStep) return;

      const isValidationPassed = handleInputValidation({ formStep: currentStep });

      if (!isValidationPassed) return;

      const nextStepId = currentStep.getAttribute("ms-go-to");

      if (nextStepId) {
        goToNextStep({ nextStepId });
        return;
      }

      const nextStepConditionalElements = getMultipleHtmlElements({
        selector: "[ms-go-to]",
        parent: currentStep,
      });

      if (!nextStepConditionalElements) {
        console.error("Missing next step conditional elements for current step", currentStep);
        return;
      }

      const areConditionsRadioOptions = nextStepConditionalElements.every(
        (el) => el.tagName === "INPUT" && el.getAttribute("type") === "radio"
      );

      if (areConditionsRadioOptions) {
        const checkedOption = nextStepConditionalElements.find(
          (el) => (el as HTMLInputElement).checked
        ) as HTMLInputElement | undefined;

        if (!checkedOption) return;

        const nextStepId = checkedOption.getAttribute("ms-go-to");

        if (!nextStepId) {
          console.error("Missing next step id for checked option", checkedOption);
          return;
        }

        goToNextStep({ nextStepId });
      }
    };

    const handlePrev = () => {
      goToPrevStep();
    };

    const handleSubmit = () => {
      const disabledFormSteps =
        getMultipleHtmlElements<HTMLFieldSetElement>({
          selector: "fieldset[ms-form-step][disabled]",
          parent: form,
        }) || [];

      const proxyCheckboxInputs = (
        getMultipleHtmlElements<HTMLInputElement>({
          selector: 'input[type="checkbox"][ms-target-input-name]',
          parent: form,
        }) || []
      ).filter((checkbox) => checkbox.getAttribute("ms-target-input-name") !== null);

      disabledFormSteps.forEach((step) => {
        step.remove();
      });

      proxyCheckboxInputs.forEach((checkbox) => {
        checkbox.remove();
      });

      submitButton.replaceWith(submitButtonOriginal);

      submitButtonOriginal.click();
    };

    adjustControlButtons();

    nextButton.addEventListener("click", () => {
      handleNext();
    });

    prevButton.addEventListener("click", () => {
      handlePrev();
    });

    submitButton.addEventListener("click", () => {
      handleSubmit();
    });

    const setupRadioButtons = () => {
      const allRadioButtons =
        getMultipleHtmlElements<HTMLInputElement>({
          selector: 'input[type="radio"]',
          parent: form,
        }) || [];

      for (const radioButton of allRadioButtons) {
        const radioLabel = radioButton.closest("label");

        if (!radioLabel) {
          console.error("Missing label for radio button", radioButton);
          return;
        }
        radioButton.addEventListener("change", () => {
          const prevRadioLabel = radioLabel.parentElement?.querySelector("label.is-selected");

          radioLabel.classList.add("is-selected");
          prevRadioLabel?.classList.remove("is-selected");
        });
      }
    };

    const setupCheckboxes = () => {
      const allCheckboxes =
        getMultipleHtmlElements<HTMLInputElement>({
          selector: 'input[type="checkbox"]',
          parent: form,
        }) || [];

      for (const checkbox of allCheckboxes) {
        const checkboxLabel = checkbox.closest("label");

        if (!checkboxLabel) {
          console.error("Missing label for checkbox", checkbox);
          return;
        }

        const checkboxRealInputName = checkbox.getAttribute("ms-target-input-name");
        const checkboxRealInput = checkboxRealInputName
          ? form.querySelector<HTMLInputElement>(`input[name="${checkboxRealInputName}"]`)
          : null;

        checkbox.addEventListener("change", () => {
          if (checkbox.checked) {
            checkboxLabel.classList.add("is-selected");
          } else {
            checkboxLabel.classList.remove("is-selected");
          }

          if (checkboxRealInput) {
            const selectedValues = checkboxRealInput.value
              .split(",")
              .map((value) => value.trim())
              .filter(Boolean);

            const checkboxValue = checkbox.value.trim();

            if (!checkboxValue) return;

            if (checkbox.checked) {
              if (!selectedValues.includes(checkboxValue)) {
                selectedValues.push(checkboxValue);
              }
            } else {
              const valueIndex = selectedValues.indexOf(checkboxValue);

              if (valueIndex !== -1) {
                selectedValues.splice(valueIndex, 1);
              }
            }

            checkboxRealInput.value = selectedValues.join(", ");
          }
        });
      }
    };

    setupRadioButtons();
    setupCheckboxes();
  }
};

initMsForm();
