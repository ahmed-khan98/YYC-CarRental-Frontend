import Navbar from "@/components/navbar.tsx";
import Footer from "@/components/footer.tsx";
import { motion } from "motion/react";
import { MapPin, Phone, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { ContactForm } from "@/pages/contact/contact-form.tsx";

const CONTACT = {
  address: "Calgary, Alberta, Canada",
  phone: "(825) 779-7797",
  phoneHref: "tel:+18257797797",
  email: "info@yyccarrental.com",
};

export default function ContactPage() {
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
                  <ContactForm />
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
