// Shared result of a Server Action: `{ error }` on failure, `{ success: true, ...data }` on success.
// Actions return it instead of throwing for anything the user can cause (bad input, wrong password,
// rate limit); only redirect()/signIn() throws are left alone because Next.js uses them for control flow.
export type ActionResult<T extends object = object> =
  | { success?: undefined; error: string }
  | ({ success: true; error?: undefined } & T);

// State of a form bound with useActionState: undefined until the first submit.
export type ActionState<T extends object = object> = ActionResult<T> | undefined;
