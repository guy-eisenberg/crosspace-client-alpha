export const R = {
  space: (id: string) => ({
    otp: `space-${id}-otp`,
  }),
  otp: (otpHash: string) => ({
    space: `otp-${otpHash}-space`,
  }),
};
