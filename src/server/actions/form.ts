export function voidAction(
  fn: (formData: FormData) => Promise<unknown>,
): (formData: FormData) => Promise<void> {
  return fn as (formData: FormData) => Promise<void>;
}
