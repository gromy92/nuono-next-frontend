export type ChangePasswordFormValues = {
  currentPassword: string;
  password1: string;
  password2: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export function buildChangePasswordRequest(
  values: ChangePasswordFormValues
): ChangePasswordRequest {
  return {
    currentPassword: values.currentPassword,
    newPassword: values.password1
  };
}
