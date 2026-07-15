import { UserCheck } from "lucide-react";

import type { CustomerMatch } from "../types";

type CustomerSectionProps = {
  readonly phone: string;
  readonly name: string;
  readonly email: string;
  readonly suburb: string;
  readonly matches: readonly CustomerMatch[];
  readonly matchesOpen: boolean;
  readonly onPhoneChange: (value: string) => void;
  readonly onNameChange: (value: string) => void;
  readonly onEmailChange: (value: string) => void;
  readonly onSuburbChange: (value: string) => void;
  readonly onApplyMatch: (match: CustomerMatch) => void;
};

export function CustomerSection(props: CustomerSectionProps) {
  return (
    <section className="card">
      <h2 className="mb-4 text-base font-semibold text-carbon-950">Customer</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="relative">
          <label htmlFor="in-phone" className="label">
            Phone
          </label>
          <input
            id="in-phone"
            className="input"
            required
            inputMode="tel"
            placeholder="04xx xxx xxx"
            value={props.phone}
            onChange={(event) => props.onPhoneChange(event.target.value)}
            autoComplete="off"
          />
          {props.matchesOpen && (
            <ul className="absolute z-20 mt-1 w-full overflow-hidden  border border-carbon-150 bg-bone-50 shadow-hard">
              {props.matches.map((match) => (
                <li key={match.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-bone-100"
                    onClick={() => props.onApplyMatch(match)}
                  >
                    <UserCheck
                      className="h-4 w-4 shrink-0 text-emerald-600"
                      aria-hidden
                    />
                    <span>
                      <span className="font-medium text-carbon-950">
                        {match.name}
                      </span>{" "}
                      <span className="text-carbon-500">
                        {match.phone}
                        {match.suburb ? ` · ${match.suburb}` : ""}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label htmlFor="in-name" className="label">
            Full name
          </label>
          <input
            id="in-name"
            className="input"
            required
            value={props.name}
            onChange={(event) => props.onNameChange(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="in-email" className="label">
            Email <span className="text-carbon-400">(optional)</span>
          </label>
          <input
            id="in-email"
            className="input"
            type="email"
            value={props.email}
            onChange={(event) => props.onEmailChange(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="in-suburb" className="label">
            Suburb <span className="text-carbon-400">(optional)</span>
          </label>
          <input
            id="in-suburb"
            className="input"
            value={props.suburb}
            onChange={(event) => props.onSuburbChange(event.target.value)}
          />
        </div>
      </div>
    </section>
  );
}
