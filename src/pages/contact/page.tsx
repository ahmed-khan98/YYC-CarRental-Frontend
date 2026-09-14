import { useState, type FormEvent } from "react";
import Navbar from "@/components/navbar.tsx";
import Footer from "@/components/footer.tsx";
import { motion } from "motion/react";
import { MapPin, Phone, Mail, Send, Loader2, CircleCheck, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import { toast } from "sonner";
import { contactApi } from "@/api/contact.api.ts";
import { getApiErrorMessage } from "@/api/client.ts";

const CONTACT = {
  address: "Calgary, Alberta, Canada",
  phone: "(825) 779-7797",
  phoneHref: "tel:+18257797797",
  email: "info@yyccarrental.com",
};

const EMPTY_FORM = {
  fullName: "",
  email: "",
  phone: "",
  message: "",
};

const SUCCESS_COPY = "Message sent. We'll get back to you soon.";

export default function ContactPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fullName = form.fullName.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const message = form.message.trim();

    if (!fullName || !email || !phone || !message) {
      const messageText = "Please fill in all required fields.";
      setFeedback({ type: "error", message: messageText });
      toast.error(messageText);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const messageText = "Enter a valid email address.";
      setFeedback({ type: "error", message: messageText });
      toast.error(messageText);
      return;
    }

    setFeedback(null);
    setSending(true);
    try {
      await contactApi.submit({ fullName, email, phone, message });
      toast.success(SUCCESS_COPY, { duration: 8000 });
      setForm(EMPTY_FORM);
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
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="pt-16 flex-1">
        <section className="relative py-16 sm:py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
          <div className="mx-auto max-w-5xl text-center relative">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"
            >
              Contact <span className="text-primary">YYC Car Rental</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Questions about a booking, our fleet, or pickup in Calgary? Send us a message and our team will reply as soon as we can.
            </motion.p>
          </div>
        </section>

        <section className="pb-16 px-4">
          <div className="mx-auto max-w-5xl grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-start">
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45 }}
              className="space-y-4"
            >
              {[
                {
                  icon: MapPin,
                  label: "Address",
                  value: CONTACT.address,
                  href: undefined,
                },
                {
                  icon: Phone,
                  label: "Phone",
                  value: CONTACT.phone,
                  href: CONTACT.phoneHref,
                },
                {
                  icon: Mail,
                  label: "Email",
                  value: CONTACT.email,
                  href: `mailto:${CONTACT.email}`,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-card border border-border/50 rounded-2xl p-5 flex gap-4"
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{item.label}</p>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors break-words"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}

              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Booking and reservation requests go to{" "}
                  <a href="mailto:booking@yyccarrental.com" className="text-primary hover:underline">
                    booking@yyccarrental.com
                  </a>
                  . Messages submitted here are delivered to that inbox.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
            >
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle>Send a message</CardTitle>
                  <CardDescription>
                    Tell us how we can help. All fields are required.
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="you@email.com"
                          disabled={sending}
                        />
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
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
