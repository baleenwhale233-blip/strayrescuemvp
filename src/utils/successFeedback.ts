import Taro from "@tarojs/taro";

type SuccessFeedbackOptions = {
  title: string;
  delay?: number;
  navigateBack?: boolean;
};

export function showSuccessFeedback({
  title,
  delay = 900,
  navigateBack = true,
}: SuccessFeedbackOptions) {
  Taro.showToast({
    title,
    icon: "none",
    duration: delay,
  });

  if (!navigateBack) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    setTimeout(() => {
      void Taro.navigateBack();
      resolve();
    }, delay);
  });
}
