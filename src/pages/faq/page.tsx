import { useState } from "react";
import Navbar from "@/components/navbar.tsx";
import Footer from "@/components/footer.tsx";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQS = [
  {
    category: "Booking",
    questions: [
      {
        q: "How do I book a car?",
        a: "Booking is simple! Browse our available vehicles on the Cars page, select your pickup and drop-off dates, choose a location, and click 'Book Now'. You'll be guided through the booking flow where you can add optional services and confirm your reservation. Bookings are confirmed instantly.",
      },
      {
        q: "Can I modify my booking after it's confirmed?",
        a: "Currently, modifications to existing bookings are not supported online. To modify your booking, please contact our support team at hello@yycdrive.ca at least 24 hours before your pickup time, and we'll do our best to accommodate your changes.",
      },
      {
        q: "Can the admin book a car on my behalf?",
        a: "Yes! Our team can create a booking on your behalf. Contact us with your desired vehicle, dates, and locations, and we'll set it up for you in our system.",
      },
      {
        q: "Is there a minimum rental period?",
        a: "The minimum rental period is 1 day. There is no maximum rental period — we offer weekly, monthly, and long-term rental rates for extended needs.",
      },
    ],
  },
  {
    category: "Cancellation & Refunds",
    questions: [
      {
        q: "What is the cancellation policy?",
        a: "You can cancel your booking up to 24 hours before the scheduled pickup time at no charge. Cancellations within 24 hours of pickup may incur a cancellation fee equivalent to one day's rental rate. No-shows are charged the full booking amount.",
      },
      {
        q: "How long do refunds take?",
        a: "Refunds for eligible cancellations are processed within 5–10 business days, depending on your bank or card issuer.",
      },
      {
        q: "What if YYCDrive cancels my booking?",
        a: "In the rare case that we need to cancel your booking (e.g., vehicle unavailability due to unforeseen maintenance), you will receive a full refund and a written explanation. We will also try to offer you an alternative vehicle if available.",
      },
    ],
  },
  {
    category: "Required Documents",
    questions: [
      {
        q: "What documents do I need to rent a car?",
        a: "You need: (1) A valid driver's license issued at least 1 year ago. (2) A valid credit or debit card in your name for the security deposit. International renters also need an International Driving Permit.",
      },
      {
        q: "What is the minimum age to rent?",
        a: "Renters must be at least 21 years of age. Some luxury and premium vehicles require renters to be 25 or older. The age requirement will be shown on the vehicle listing.",
      },
      {
        q: "Do I need to upload my license in advance?",
        a: "Yes, your driver's license must be uploaded to your profile before making a booking. This is required for identity verification and ensures a faster pickup process.",
      },
    ],
  },
  {
    category: "Payment",
    questions: [
      {
        q: "What payment methods are accepted?",
        a: "We accept all major credit and debit cards including Visa, Mastercard, and American Express. The card must be in the renter's name.",
      },
      {
        q: "Is a security deposit required?",
        a: "Yes, a security deposit is pre-authorized on your card at pickup. The amount varies by vehicle category. It is released within 3–5 business days after the vehicle is returned in satisfactory condition.",
      },
      {
        q: "Are there any hidden fees?",
        a: "No hidden fees! The price you see when booking includes all applicable taxes. Optional add-ons (insurance, GPS, child seat, etc.) are clearly priced. Additional charges only apply if you incur damage, late return, or violations during the rental.",
      },
    ],
  },
  {
    category: "Pickup & Return",
    questions: [
      {
        q: "What happens at pickup (check-in)?",
        a: "At pickup, our team will verify your identity and conduct a vehicle inspection. You'll document the car's condition with photos, note the mileage and fuel level, and confirm any pre-existing damage. This protects both you and us.",
      },
      {
        q: "What happens at return (check-out)?",
        a: "At return, you'll document the vehicle's condition with photos, note the mileage and fuel level. Our team will compare the return condition to the pickup photos. If everything is in order, your security deposit will be released.",
      },
      {
        q: "What if I need to return the car early?",
        a: "Early returns are accepted. You will only be charged for the days you actually used the vehicle. However, prepaid weekly or monthly rates may not be prorated.",
      },
      {
        q: "What if I'm running late for pickup or return?",
        a: "If you're running late, please contact us as soon as possible. We'll do our best to accommodate you. Returning late without notice may result in additional charges.",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-card/50 transition-colors cursor-pointer"
      >
        <span className="font-medium text-sm pr-4">{q}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-3">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="pt-16 flex-1">
        <section className="py-16 px-4">
          <div className="mx-auto max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-4xl font-bold mb-3">Frequently Asked Questions</h1>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Find answers to the most common questions about renting with YYCDrive. Can't find what you're looking for? Contact us at hello@yycdrive.ca.
              </p>
            </motion.div>

            <div className="space-y-10">
              {FAQS.map((category, ci) => (
                <motion.div
                  key={category.category}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: ci * 0.05 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-lg font-semibold mb-4 text-primary">{category.category}</h2>
                  <div className="space-y-2">
                    {category.questions.map((item, qi) => (
                      <FAQItem key={qi} q={item.q} a={item.a} />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
