import Navbar from "@/components/navbar.tsx";
import Footer from "@/components/footer.tsx";
import { motion } from "motion/react";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    content: [
      "**Account Information:** When you create an account or complete a booking, we collect your full name, email address, phone number, and driver's license information.",
      "**Booking Data:** We collect details of your rental bookings including pickup/drop-off locations, dates, vehicle selections, and add-on services.",
      "**Payment Information:** Payment details are processed securely through our payment partners. We do not store your full credit card numbers on our servers.",
      "**Usage Data:** We collect information about how you interact with our platform, including pages visited, features used, and device/browser information.",
      "**Vehicle Inspection Photos:** Photos uploaded during check-in and check-out are stored securely and used solely for documenting vehicle condition.",
    ],
  },
  {
    title: "2. How We Use Your Information",
    content: [
      "To process and manage your rental bookings and transactions.",
      "To verify your identity and driving license for safety purposes.",
      "To communicate with you about your bookings, account updates, and service notifications.",
      "To improve our platform, services, and customer experience.",
      "To comply with legal obligations and enforce our Terms of Service.",
      "To detect and prevent fraud, unauthorized access, and other harmful activity.",
    ],
  },
  {
    title: "3. Information Sharing",
    content: [
      "We do not sell, trade, or rent your personal information to third parties for marketing purposes.",
      "We may share your information with trusted service providers who help us operate our platform (e.g., payment processors, cloud storage providers) under strict confidentiality agreements.",
      "We may disclose your information to comply with applicable laws, regulations, or valid legal processes.",
      "In the event of a business merger or acquisition, your information may be transferred as part of that transaction.",
    ],
  },
  {
    title: "4. Data Security",
    content: [
      "We implement industry-standard security measures to protect your personal information, including SSL/TLS encryption for data in transit and secure storage for data at rest.",
      "Access to personal data is restricted to authorized personnel who need it to perform their job functions.",
      "We regularly review our security practices and update them as needed to maintain appropriate protections.",
      "While we take reasonable steps to protect your information, no online service can guarantee absolute security. Please use strong passwords and keep your account credentials confidential.",
    ],
  },
  {
    title: "5. Cookies & Tracking",
    content: [
      "We use cookies and similar technologies to maintain your session, remember your preferences, and improve your experience on our platform.",
      "Essential cookies are required for the platform to function. You may decline non-essential cookies, though this may affect some features.",
      "We do not use cookies for advertising tracking or third-party behavioral profiling.",
    ],
  },
  {
    title: "6. Data Retention",
    content: [
      "We retain your account and booking data for as long as your account is active or as needed to provide services.",
      "Booking records are retained for a minimum of 5 years for legal and accounting purposes.",
      "Vehicle inspection photos are retained for 12 months after the rental period ends.",
      "You may request deletion of your account and personal data, subject to legal retention requirements.",
    ],
  },
  {
    title: "7. Your Rights",
    content: [
      "You have the right to access, correct, or delete your personal information.",
      "You may request a copy of the data we hold about you.",
      "You may opt out of non-essential communications at any time.",
      "To exercise your rights, contact us at privacy@yycdrive.ca.",
    ],
  },
  {
    title: "8. Changes to This Policy",
    content: [
      "We may update this Privacy Policy from time to time. We will notify you of significant changes by email or via a notice on our platform.",
      "Continued use of YYCDrive after changes are posted constitutes your acceptance of the updated policy.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="pt-16 flex-1">
        <section className="py-16 px-4">
          <div className="mx-auto max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
              <h1 className="text-4xl font-bold mb-3">Privacy Policy</h1>
              <p className="text-muted-foreground">Last updated: January 1, 2025</p>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                YYCDrive ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our car rental platform.
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
                        <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>') }} />
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 bg-primary/5 border border-primary/20 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-2">Contact Us</h2>
              <p className="text-sm text-muted-foreground">
                If you have questions about this Privacy Policy or how we handle your data, please contact us at:{" "}
                <a href="mailto:privacy@yycdrive.ca" className="text-primary hover:underline">privacy@yycdrive.ca</a>
              </p>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
