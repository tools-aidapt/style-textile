import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { basicAuthFor, config, reportMissingConfig } from "@/lib/config";
import { reportSubmissionFailure } from "@/lib/telemetry";
import { Eyebrow } from "./primitives";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileDrop } from "./FileDrop";
import { IMAGE_TYPES, RESUME_TYPES } from "./files";
import {
  CURRENCIES,
  DEFAULT_COUNTRY,
  DEFAULT_CURRENCY,
  DIAL_CODES,
  dialFor,
} from "./locale";
import type { Position } from "./position";

/** How long a genuine application takes to fill in, at the absolute fastest. */
const MIN_FILL_MS = 4000;

/** Uploads are two files; generous, but not indefinite. */
const SUBMIT_TIMEOUT_MS = 60_000;

const digitsOf = (value: string) => value.replace(/\D/g, "");

/**
 * The number without its country code, which now travels in its own field.
 *
 * Validated on digits rather than characters, because "300 000 0000" is a
 * perfectly ordinary way to write a number and counting characters rejected
 * it for being one space too long. The bounds are wide: national numbers run
 * from 7 digits in parts of the Gulf to 11 in Nigeria, and a candidate who
 * types their leading 0 should not be corrected for it.
 */
const phone = z
  .string()
  .trim()
  .min(1, "Please enter your mobile number")
  .refine((v) => /^[()\d\s-]+$/.test(v), "Use digits, spaces, and ( ) - only")
  .refine((v) => digitsOf(v).length >= 6, "Please enter at least 6 digits")
  .refine((v) => digitsOf(v).length <= 14, "That is more than 14 digits");

/**
 * An amount, typed the way people type money: "150000", "150,000", "150 000".
 * The field says numeric, so it should mean it — "negotiable" used to pass.
 */
const amount = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Please enter your ${label}`)
    .refine((v) => /^[\d,\s.]+$/.test(v), "Please enter a number, without words")
    .refine((v) => {
      const n = Number(digitsOf(v));
      return Number.isFinite(n) && n > 0;
    }, "Please enter an amount greater than zero");

const formSchema = z.object({
  openPosition: z.string().min(1, "Please select a position"),
  fullName: z
    .string()
    .trim()
    .min(2, "Please enter your full name")
    .max(100, "Please keep this under 100 characters"),
  email: z
    .string()
    .trim()
    .max(255, "Please keep this under 255 characters")
    .email("Please enter a valid email address"),
  mobile: phone,
  /** Alpha-2, resolved to a dial code on submit. See locale.ts. */
  mobileCountry: z.string().min(1, "Please choose a country code"),
  /** ISO 4217, and the unit both salary amounts are read in. */
  salaryCurrency: z.string().min(1, "Please choose a currency"),
  currentSalary: amount("current or last salary"),
  currentBenefits: z
    .string()
    .trim()
    .min(2, "Please list your current or last benefits")
    .max(2000, "Please keep this under 2000 characters"),
  expectedSalary: amount("expected salary"),
  noticePeriod: z
    .string()
    .trim()
    .min(1, "Please enter your notice period in days")
    .refine((v) => /^\d+$/.test(v), "Please enter a whole number of days")
    .refine((v) => Number(v) <= 365, "Please enter 365 days or fewer"),
  /** Honeypot: invisible to people, irresistible to form-filling bots. */
  companyWebsite: z.string().max(0).optional(),
});

type FormData = z.infer<typeof formSchema>;

/** A labelled field with its error wired up for screen readers. */
const Field = ({
  id,
  label,
  error,
  hint,
  children,
  className,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("space-y-2", className)}>
    <Label htmlFor={id} className="text-body-sm font-medium text-ink-900">
      {label}
      <span className="ml-1 text-ember-500" aria-hidden="true">
        *
      </span>
    </Label>
    {children}
    {hint && !error ? <p className="text-caption text-steel-600">{hint}</p> : null}
    {error ? (
      <p id={`${id}-error`} role="alert" className="text-body-sm text-destructive">
        {error}
      </p>
    ) : null}
  </div>
);

/**
 * A field whose left edge is a chooser rather than a fixed label — currency on
 * the salaries, country code on the mobile. The select and the input share one
 * border so the pair reads as a single control; the border carries the hover,
 * focus and invalid states the Input would normally paint on itself, which is
 * why the Input inside is stripped of its own.
 */
const PrefixedField = ({
  invalid,
  children,
}: {
  invalid: boolean;
  children: React.ReactNode;
}) => (
  <div
    className={cn(
      "flex h-11 w-full items-center rounded-md border border-mist-200 bg-white transition-colors duration-fast",
      "hover:border-mist-300 focus-within:border-teal-400",
      invalid && "border-destructive hover:border-destructive",
    )}
  >
    {children}
  </div>
);

/** The hairline between the chooser and the value it qualifies. */
const PrefixDivider = () => <span className="h-5 w-px shrink-0 bg-mist-200" aria-hidden="true" />;

/** The Input, stripped of the chrome PrefixedField now owns. */
const prefixedInputClass =
  "h-full flex-1 border-0 bg-transparent pl-2.5 font-mono tabular-nums hover:border-0 focus-visible:border-0";

/**
 * The chooser itself. Closed, it shows the short code — "KES", "+254" — because
 * that is what the value beside it needs qualifying by. Open, every row is
 * written out, so nobody has to know that RWF is Rwandan or that +255 is
 * Tanzania.
 */
const PrefixSelect = ({
  label,
  value,
  onChange,
  width,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  width: string;
  children: React.ReactNode;
}) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger
      aria-label={label}
      className={cn(
        "h-full shrink-0 justify-between gap-1 rounded-l-md rounded-r-none border-0 bg-transparent pl-3 pr-2",
        "font-mono text-caption font-medium text-ink-900 hover:border-0 focus-visible:border-0",
        width,
      )}
    >
      <SelectValue />
    </SelectTrigger>
    <SelectContent className="max-h-72">{children}</SelectContent>
  </Select>
);

/** Salary input with the currency chosen in the field rather than assumed. */
const SalaryInput = ({
  id,
  registration,
  invalid,
  placeholder,
  currency,
  onCurrencyChange,
}: {
  id: string;
  registration: ReturnType<ReturnType<typeof useForm<FormData>>["register"]>;
  invalid: boolean;
  placeholder: string;
  currency: string;
  /**
   * Only the first salary field carries the chooser. One application is quoted
   * in one currency, so a second selector could only ever disagree with the
   * first; the expected-salary field shows the choice instead of repeating it.
   */
  onCurrencyChange?: (value: string) => void;
}) => (
  <PrefixedField invalid={invalid}>
    {onCurrencyChange ? (
      <PrefixSelect
        label="Salary currency"
        value={currency}
        onChange={onCurrencyChange}
        width="w-[5.25rem]"
      >
        {CURRENCIES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            <span className="font-mono font-medium">{c.code}</span>
            <span className="ml-2 text-steel-600">{c.name}</span>
          </SelectItem>
        ))}
      </PrefixSelect>
    ) : (
      <span
        className="w-[5.25rem] shrink-0 pl-3 font-mono text-caption font-medium text-steel-500"
        aria-hidden="true"
      >
        {currency}
      </span>
    )}
    <PrefixDivider />
    <Input
      id={id}
      inputMode="numeric"
      placeholder={placeholder}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? `${id}-error` : undefined}
      className={prefixedInputClass}
      {...registration}
    />
  </PrefixedField>
);

/**
 * A step's header.
 *
 * It breaks out of the fieldset's padding to become a full-width band, so a
 * step reads as a section of the form rather than a paragraph inside it — and
 * so it carries the same diagonal sweep the requisition form's section headers
 * do. The negative margins mirror the fieldset's own `p-5 sm:p-6`; the card
 * clips them, so the band sits flush to its edges.
 */
const SectionRule = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
  <div className="surface-sweep-light has-grain -mx-5 -mt-5 border-b border-frost-200 px-5 py-3.5 [--grain-strength:0.35] sm:-mx-6 sm:-mt-6 sm:px-6">
    <div className="relative z-raised space-y-1">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h3 className="text-h6 font-bold tracking-snug text-ink-900">{title}</h3>
    </div>
  </div>
);

export const ApplicationForm = ({
  position,
  onDirtyChange,
  onBrowseOther,
}: {
  position: Position;
  /** Lets the page warn before discarding a part-written application */
  onDirtyChange?: (dirty: boolean) => void;
  /** Offered once the application is in, so the page is not a dead end */
  onBrowseOther?: () => void;
}) => {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  /**
   * The two files sit outside the zod schema, so a submit with either one
   * missing used to be reported by a toast alone. A toast is transient, is not
   * tied to the control that needs fixing, and on a long form is often shown
   * off-screen from it — the candidate was told something was wrong without
   * being shown where. These put the message on the field, the way every other
   * error on this form already works.
   */
  const [fileErrors, setFileErrors] = useState<{ resume?: string; photo?: string }>({});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      openPosition: position.id,
      companyWebsite: "",
      // The roles are Kenyan; a Kenyan candidate should not have to choose
      mobileCountry: DEFAULT_COUNTRY,
      salaryCurrency: DEFAULT_CURRENCY,
    },
  });

  // A form completed faster than a person can read it was not filled by one
  const mountedAt = useRef(Date.now());

  // Keep the hidden position id in step with the role being viewed
  useEffect(() => {
    setValue("openPosition", position.id);
  }, [position.id, setValue]);

  const values = watch();
  /** Both salary fields read in this unit; only the first one can change it. */
  const currency = values.salaryCurrency ?? DEFAULT_CURRENCY;
  const textFields: (keyof FormData)[] = [
    "fullName",
    "email",
    "mobile",
    "currentSalary",
    "expectedSalary",
    "currentBenefits",
    "noticePeriod",
  ];
  const filled = textFields.filter((f) => (values[f] ?? "").toString().trim() !== "").length;
  const completed = filled + (resumeFile ? 1 : 0) + (photoFile ? 1 : 0);
  const total = textFields.length + 2;

  // Report progress upward so leaving the page can ask first
  const hasInput = completed > 0 && !isSubmitted;
  useEffect(() => {
    onDirtyChange?.(hasInput);
  }, [hasInput, onDirtyChange]);

  const onSubmit = async (data: FormData) => {
    // Silently drop anything that tripped the honeypot or filled the form in
    // less time than reading it takes. A bot learns nothing from success.
    if (data.companyWebsite || Date.now() - mountedAt.current < MIN_FILL_MS) {
      setIsSubmitted(true);
      return;
    }

    // Files sit outside the schema, so they are checked here
    const missing = {
      resume: resumeFile ? undefined : "Please attach your resume",
      photo: photoFile ? undefined : "Please attach your photo",
    };
    setFileErrors(missing);
    if (!resumeFile || !photoFile) {
      // Errors show on the fields; the form still has to take the reader to
      // them, because on a phone the documents step is a screen or two away
      document
        .getElementById("application-documents")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!config.applicationWebhookUrl) {
      reportMissingConfig("VITE_APPLICATION_WEBHOOK_URL");
      toast.error("Applications are temporarily unavailable. Please try again later.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("openPosition", data.openPosition);
      /**
       * The same ClickUp task id, under the two names the downstream workflow
       * reads it by. This page knows one identifier for a role — the id of its
       * task on the Positions list — so taskId and positionId are that value,
       * not two different things.
       */
      formData.append("taskId", data.openPosition);
      formData.append("positionId", data.openPosition);
      formData.append("fullName", data.fullName);
      formData.append("email", data.email);
      /**
       * The number goes out three ways: assembled into its full international
       * form, which is what a recruiter dials, and as its two parts, which is
       * what a workflow can filter or normalise on.
       */
      const dial = dialFor(data.mobileCountry);
      formData.append("mobile", `${dial} ${data.mobile}`.trim());
      formData.append("mobileCountry", data.mobileCountry);
      formData.append("mobileDialCode", dial);
      formData.append("mobileNumber", data.mobile);
      /** Amounts stay bare numbers; the unit they are in travels beside them. */
      formData.append("salaryCurrency", data.salaryCurrency);
      formData.append("currentSalary", data.currentSalary);
      formData.append("currentBenefits", data.currentBenefits);
      formData.append("expectedSalary", data.expectedSalary);
      formData.append("noticePeriod", data.noticePeriod);
      formData.append("resumeFile", resumeFile);
      formData.append("photo", photoFile);
      // The id is client-supplied and must be re-resolved server-side; the name
      // travels with it so n8n can verify the two still agree
      formData.append("positionName", position.name);

      const auth = basicAuthFor(
        config.applicationWebhookUser,
        config.applicationWebhookPassword,
      );
      const headers: Record<string, string> = auth
        ? { Authorization: `Basic ${btoa(`${auth.username}:${auth.password}`)}` }
        : {};

      const response = await fetch(config.applicationWebhookUrl, {
        method: "POST",
        headers,
        body: formData,
        signal: AbortSignal.timeout(SUBMIT_TIMEOUT_MS),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        reportSubmissionFailure("http", { status: response.status, position: position.id });
        toast.error(
          response.status >= 500
            ? "Our side had a problem accepting that. Please try again in a moment."
            : "Submission failed. Please check your details and try again.",
        );
      }
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === "TimeoutError";
      reportSubmissionFailure(timedOut ? "timeout" : "network", {
        position: position.id,
        message: error instanceof Error ? error.message : String(error),
      });
      toast.error(
        timedOut
          ? "That took too long to send. Check your connection and try again."
          : "We couldn't submit your application. Check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // A confirmation the candidate can actually read — the old flow reset the
  // form and left only a toast, so a successful application looked like a wipe
  if (isSubmitted) {
    return (
      <div
        id="apply"
        className="scroll-mt-24 rounded-lg border border-mist-200 bg-white p-8 text-center shadow-sm sm:p-12"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
          <Check className="h-6 w-6 text-teal-400" aria-hidden="true" />
        </div>
        <h2 className="mt-6 text-h4 font-bold tracking-snug text-ink-900">Application received</h2>
        <p className="measure mx-auto mt-3 text-body text-steel-600">
          Thank you. Your application for <span className="font-medium text-ink-900">{position.name}</span>{" "}
          is with our recruitment team. If your experience matches the role, we will be in touch about
          next steps.
        </p>
        <p className="mt-6 text-caption text-steel-500">
          Keep an eye on the inbox you gave us, including the spam folder.
        </p>

        {onBrowseOther ? (
          <div className="mt-8 flex justify-center">
            <Button variant="secondary" onClick={onBrowseOther}>
              Browse other roles
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      id="apply"
      className="scroll-mt-24 overflow-hidden rounded-lg border border-mist-200 bg-white shadow-sm"
    >
      {/* Water keyline — the hero anchor on this surface */}
      <div className="h-0.5 bg-teal-400" aria-hidden="true" />

      <div className="surface-sweep-light has-grain border-b border-frost-200 p-5 [--grain-strength:0.35] sm:p-6">
        <div className="relative z-raised">
          <h2 className="text-h4 font-bold tracking-snug text-ink-900">Apply for this role</h2>
          <p className="measure mt-2 text-body text-steel-600">
            Seven fields and two files. Everything marked with an asterisk is required.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="divide-y divide-mist-100">
        <input type="hidden" {...register("openPosition")} />

        {/* Honeypot. Hidden from people and from assistive technology, so
            anything that fills it in is not a candidate. The style is inline
            rather than a utility class: this must stay hidden even if the
            stylesheet fails to load, which is exactly when a bot is looking. */}
        <div style={{ display: "none" }} aria-hidden="true">
          <label htmlFor="companyWebsite">Company website</label>
          <input
            id="companyWebsite"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register("companyWebsite")}
          />
        </div>

        {/* About you */}
        <fieldset className="space-y-5 p-5 sm:p-6">
          <SectionRule eyebrow="Step one" title="About you" />

          <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2">
            <Field id="fullName" label="Full name" error={errors.fullName?.message} className="sm:col-span-2">
              <Input
                id="fullName"
                autoComplete="name"
                placeholder="As it appears on your documents"
                aria-invalid={errors.fullName ? true : undefined}
                aria-describedby={errors.fullName ? "fullName-error" : undefined}
                {...register("fullName")}
              />
            </Field>

            <Field id="email" label="Email" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
            </Field>

            <Field id="mobile" label="Mobile" error={errors.mobile?.message}>
              <PrefixedField invalid={!!errors.mobile}>
                <PrefixSelect
                  label="Country code"
                  value={values.mobileCountry ?? DEFAULT_COUNTRY}
                  onChange={(v) =>
                    setValue("mobileCountry", v, { shouldValidate: true })
                  }
                  width="w-[5.25rem]"
                >
                  {DIAL_CODES.map((c) => (
                    <SelectItem key={c.country} value={c.country}>
                      <span className="font-mono font-medium">{c.dial}</span>
                      <span className="ml-2 text-steel-600">{c.name}</span>
                    </SelectItem>
                  ))}
                </PrefixSelect>
                <PrefixDivider />
                <Input
                  id="mobile"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="712 345 678"
                  aria-invalid={errors.mobile ? true : undefined}
                  aria-describedby={errors.mobile ? "mobile-error" : undefined}
                  className={prefixedInputClass}
                  {...register("mobile")}
                />
              </PrefixedField>
            </Field>
          </div>
        </fieldset>

        {/* Compensation */}
        <fieldset className="space-y-5 p-5 sm:p-6">
          <SectionRule eyebrow="Step two" title="Compensation and notice" />

          <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2">
            <Field
              id="currentSalary"
              label="Current or last salary"
              error={errors.currentSalary?.message}
              hint="Monthly gross"
            >
              <SalaryInput
                id="currentSalary"
                registration={register("currentSalary")}
                invalid={!!errors.currentSalary}
                placeholder="150,000"
                currency={currency}
                onCurrencyChange={(v) =>
                  setValue("salaryCurrency", v, { shouldValidate: true })
                }
              />
            </Field>

            <Field
              id="expectedSalary"
              label="Expected salary"
              error={errors.expectedSalary?.message}
              hint="Monthly gross"
            >
              <SalaryInput
                id="expectedSalary"
                registration={register("expectedSalary")}
                invalid={!!errors.expectedSalary}
                placeholder="200,000"
                currency={currency}
              />
            </Field>

            <Field
              id="noticePeriod"
              label="Notice period"
              error={errors.noticePeriod?.message}
              hint="In days"
            >
              <Input
                id="noticePeriod"
                inputMode="numeric"
                placeholder="30"
                aria-invalid={errors.noticePeriod ? true : undefined}
                aria-describedby={errors.noticePeriod ? "noticePeriod-error" : undefined}
                className="font-mono tabular-nums"
                {...register("noticePeriod")}
              />
            </Field>

            <Field
              id="currentBenefits"
              label="Current or last benefits"
              error={errors.currentBenefits?.message}
              className="sm:col-span-2"
            >
              <Textarea
                id="currentBenefits"
                placeholder="Medical cover, provident fund, transport allowance, and anything else you receive"
                aria-invalid={errors.currentBenefits ? true : undefined}
                aria-describedby={errors.currentBenefits ? "currentBenefits-error" : undefined}
                {...register("currentBenefits")}
              />
            </Field>
          </div>
        </fieldset>

        {/* Documents */}
        <fieldset id="application-documents" className="scroll-mt-24 space-y-5 p-5 sm:p-6">
          <SectionRule eyebrow="Step three" title="Documents" />

          <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2">
            <FileDrop
              label="Resume"
              hint="PDF, DOC or DOCX, up to 5 MB"
              accept=".pdf,.doc,.docx"
              acceptedTypes={RESUME_TYPES}
              typeError="Please attach a PDF, DOC or DOCX file."
              file={resumeFile}
              onChange={setResumeFile}
              externalError={fileErrors.resume}
              required
            />
            <FileDrop
              label="Passport-size photo"
              hint="JPG or PNG, up to 5 MB"
              accept="image/jpeg,image/jpg,image/png"
              acceptedTypes={IMAGE_TYPES}
              typeError="Please attach a JPG or PNG image."
              file={photoFile}
              onChange={setPhotoFile}
              externalError={fileErrors.photo}
              preview
              required
            />
          </div>
        </fieldset>

        {/* Action bar. The single Ember CTA on the page — Fire is the spark,
            and it marks the one action that matters. */}
        <div className="flex flex-col gap-4 bg-mist-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          {/* The same quiet meter the job description uses for reading
              progress: a filling hairline and a count. Two different visual
              languages for "how far through am I" on one page was one too
              many, and a bare fraction gave no sense of the distance left. */}
          <div className="flex items-center gap-3">
            <div
              className="h-1 w-28 overflow-hidden rounded-pill bg-mist-100"
              role="progressbar"
              aria-valuenow={completed}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label="Fields completed"
            >
              <div
                className="h-full rounded-pill bg-teal-400 transition-[width] duration-slow ease-forward"
                style={{ width: `${(completed / total) * 100}%` }}
              />
            </div>
            <p className="text-body-sm text-steel-600" role="status" aria-live="polite">
              <span className="font-mono font-medium tabular-nums text-ink-900">
                {completed}/{total}
              </span>{" "}
              complete
            </p>
          </div>

          <Button type="submit" variant="cta" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Submitting
              </>
            ) : (
              <>
                Submit application
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
