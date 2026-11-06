import { useState, type FormEvent } from "react";
import { CircleAlert, CircleCheck, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import { toast } from "sonner";
import { contactApi } from "@/api/contact.api.ts";
import { getApiErrorMessage } from "@/api/client.ts";
import { EMPTY_CONTACT_FORM, validateContactForm } from "@/lib/validateContactForm.ts";
import { EMAIL_ERROR } from "@/lib/email.ts";

const SUCCESS_COPY = "Message sent. We'll get back to you soon.";

export function ContactForm() {
  const [form, setForm] = useState(EMPTY_CONTACT_FORM);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = validateContactForm(form);
    if (!result.ok) {
      const invalidEmail = result.message === EMAIL_ERROR;
      setEmailError(invalidEmail ? EMAIL_ERROR : null);
      setFeedback(invalidEmail ? null : { type: "error", message: result.message });
      toast.error(result.message);
      return;
    }

    setEmailError(null);
    setFeedback(null);
    setSending(true);
    try {
      await contactApi.submit(result.values);
      toast.success(SUCCESS_COPY, { duration: 8000 });
      setForm(EMPTY_CONTACT_FORM);
      setFeedback({ type: "success", message: SUCCESS_COPY });
    } catch (error) {
      const messageText = getApiErrorMessage(error);
      setFeedback({ type: "error", message: messageText });
      toast.error(messageText, { duration: 8000 });
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {feedback?.type === "success" ? (
        <Alert className="border-emerald-300 bg-emerald-50 text-emerald-950">
          <CircleCheck className="text-emerald-600" />
          <AlertTitle>Message sent</AlertTitle>
          <AlertDescription className="text-emerald-900">
            {feedback.message}
          </AlertDescription>
        </Alert>
      ) : null}
      {feedback?.type === "error" ? (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>Could not send</AlertTitle>
          <AlertDescription>{feedback.message}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="contact-full-name">Full Name</Label>
        <Input
          id="contact-full-name"
          name="fullName"
          autoComplete="name"
          required
          value={form.fullName}
          onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
          placeholder="Your full name"
          disabled={sending}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-email">Email Address</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, email: e.target.value }));
              if (emailError) setEmailError(null);
            }}
            placeholder="you@email.com"
            disabled={sending}
            aria-invalid={Boolean(emailError)}
          />
          {emailError ? <p className="text-[11px] text-destructive">{emailError}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-phone">Phone Number</Label>
          <Input
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="(825) 000-0000"
            disabled={sending}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          value={form.message}
          onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
          placeholder="How can we help?"
          disabled={sending}
          className="min-h-32"
        />
      </div>
      <Button type="submit" className="w-full sm:w-auto" disabled={sending}>
        {sending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Send Message
          </>
        )}
      </Button>
    </form>
  );
}
