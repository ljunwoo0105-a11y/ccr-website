type GuardResult = { readonly error: Response | null };
type BodyResult<T> =
  | { readonly data: T; readonly error: null }
  | { readonly data: null; readonly error: Response };

export type GuardFirstOptions = {
  readonly guard: () => Promise<GuardResult>;
  readonly forbidden: () => Response;
  readonly work: () => Promise<Response>;
};

export type GuardFirstBodyOptions<T, S> = {
  readonly req: Request;
  readonly schema: S;
  readonly guard: () => Promise<GuardResult>;
  readonly forbidden: () => Response;
  readonly parse: (req: Request, schema: S) => Promise<BodyResult<T>>;
  readonly invalid: () => Response;
  readonly work: (body: T) => Promise<Response>;
};

export async function runAdminGuarded(options: GuardFirstOptions): Promise<Response> {
  const result = await options.guard();
  if (result.error) return options.forbidden();
  return options.work();
}

export async function runAdminGuardedBody<T, S>(
  options: GuardFirstBodyOptions<T, S>
): Promise<Response> {
  return runAdminGuarded({
    guard: options.guard,
    forbidden: options.forbidden,
    work: async () => {
      const parsed = await options.parse(options.req, options.schema);
      if (parsed.error) return options.invalid();
      return options.work(parsed.data);
    },
  });
}
