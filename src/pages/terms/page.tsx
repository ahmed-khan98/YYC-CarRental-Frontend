import Navbar from "@/components/navbar.tsx";
import Footer from "@/components/footer.tsx";
import { motion } from "motion/react";

const SECTIONS = [
  {
    title: "1. Eligibility & Account Requirements",
    content: [
      "You must be at least 21 years of age (or 25 for certain vehicle categories) to rent a vehicle.",
      "A valid driver's license issued at least 1 year prior to the rental date is required.",
      "A valid credit or debit card in the renter's name is required for the security deposit.",
      "International renters must present an International Driving Permit alongside their foreign license.",
      "You must have a verified YYCDrive account with a completed profile, including uploaded driver's license.",
    ],
  },
  {
    title: "2. Booking Terms",
    content: [
      "All bookings are subject to vehicle availability at the time of confirmation.",
      "Bookings are confirmed upon completion and are subject to our cancellation policy.",
      "The rental period begins and ends at the agreed pickup and return times.",
      "Returning a vehicle late without prior notice may result in additional charges at the standard daily rate.",
      "YYCDrive reserves the right to cancel bookings in cases of suspected fraud or policy violations.",
    ],
  },
  {
    title: "3. Cancellation Policy",
    content: [
      "Customers may cancel a booking up to 24 hours before the scheduled pickup time without penalty.",
      "Cancellations within 24 hours of pickup may be subject to a cancellation fee equivalent to one day's rental rate.",
      "No-shows (failure to pick up the vehicle without prior cancellation) will be charged the full booking amount.",
      "YYCDrive may cancel a booking with a full refund in cases of vehicle unavailability due to unforeseen circumstances, with written reason provided to the customer.",
      "Refunds for eligible cancellations are processed within 5–10 business days.",
    ],
  },
  {
    title: "4. User Responsibilities",
    content: [
      "You are responsible for the vehicle during the rental period and must return it in the same condition as received.",
      "Vehicles must only be operated by the authorized renter listed on the booking. Additional drivers must be registered.",
      "Smoking is strictly prohibited in all YYCDrive vehicles. A cleaning fee of $250 applies for violations.",
      "Vehicles may not be used for racing, off-road driving, towing, or any illegal activities.",
      "You must report any accidents, damage, or incidents to YYCDrive and local authorities immediately.",
      "Fuel policies vary by vehicle. Vehicles must be returned with the same fuel level as at pickup.",
    ],
  },
  {
    title: "5. Vehicle Inspection & Condition",
    content: [
      "A vehicle inspection (check-in) is conducted at pickup. You must document the vehicle's condition with photos.",
      "A return inspection (check-out) is conducted when you return the vehicle, also with photos.",
      "You are liable for any new damage discovered at return that was not documented at pickup.",
      "Pre-existing damage noted at check-in will not be charged to the renter.",
      "In the event of a dispute, inspection photos serve as primary evidence of vehicle condition.",
    ],
  },
  {
    title: "6. Insurance & Liability",
    content: [
      "Basic third-party liability insurance is included in all rentals as required by Alberta law.",
      "Additional collision damage waiver (CDW) and comprehensive coverage are available as add-ons.",
      "Without optional CDW, renters are liable for repair costs up to the vehicle's current market value.",
      "YYCDrive is not responsible for personal belongings left in rental vehicles.",
      "Renters are fully liable for traffic violations, parking tickets, and fines incurred during the rental period.",
    ],
  },
  {
    title: "7. Payments & Fees",
    content: [
      "Rental charges are billed at the time of booking. A security deposit is pre-authorized on your card.",
      "Security deposits are released within 3–5 business days after the vehicle is returned in satisfactory condition.",
      "Additional charges (damage, late return, cleaning fees) will be charged to the card on file.",
      "All prices are in Canadian Dollars (CAD) and are inclusive of applicable taxes unless otherwise stated.",
    ],
  },
  {
    title: "8. Governing Law",
    content: [
      "These Terms of Service are governed by the laws of the Province of Alberta and the federal laws of Canada.",
      "Any disputes arising from these terms shall be resolved in the courts of Calgary, Alberta.",
      "If any provision of these Terms is found to be unenforceable, the remaining provisions remain in full effect.",
      "YYCDrive reserves the right to update these Terms at any time. Continued use constitutes acceptance of updated terms.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="pt-16 flex-1">
        <section className="py-16 px-4">
          <div className="mx-auto max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
              <h1 className="text-4xl font-bold mb-3">Terms of Service</h1>
              <p className="text-muted-foreground">Last updated: January 1, 2025</p>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                These Terms of Service govern your use of the YYCDrive car rental platform. By creating an account or making a booking, you agree to be bound by these terms. Please read them carefully.
              </p>
            </motion.div>

            <div className="space-y-8">
              {SECTIONS.map((section, i) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                  viewport={{ once: true }}
                  className="bg-card border border-border/50 rounded-2xl p-6"
                >
                  <h2 className="text-lg font-semibold mb-4">{section.title}</h2>
                  <ul className="space-y-2">
                    {section.content.map((item, j) => (
                      <li key={j} className="flex gap-2 text-sm text-muted-foreground leading-relaxed">
                        <span className="text-primary shrink-0 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 bg-primary/5 border border-primary/20 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-2">Questions?</h2>
              <p className="text-sm text-muted-foreground">
                For questions about these Terms of Service, contact us at:{" "}
                <a href="mailto:legal@yycdrive.ca" className="text-primary hover:underline">legal@yycdrive.ca</a>
              </p>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
