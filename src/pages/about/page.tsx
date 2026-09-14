import Navbar from "@/components/navbar.tsx";
import Footer from "@/components/footer.tsx";
import { motion } from "motion/react";
import { Shield, Star, MapPin, Users, Award, Clock } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="pt-16 flex-1">
        {/* Hero */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
          <div className="mx-auto max-w-4xl text-center relative">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"
            >
              About <span className="text-primary">YYC Car Rental</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Calgary's premium car rental platform — built for people who value quality, transparency, and seamless experiences.
            </motion.p>
          </div>
        </section>

        {/* Company Overview */}
        <section className="py-12 px-4">
          <div className="mx-auto max-w-4xl">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }}>
                <h2 className="text-2xl font-bold mb-4">Who We Are</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  YYC Car Rental was founded in Calgary, Alberta with a simple mission: make renting a premium vehicle as easy and transparent as possible. We believe every driver deserves access to quality vehicles without the hassle of hidden fees, confusing policies, or outdated booking systems.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  From economy compacts to luxury SUVs, our diverse fleet is meticulously maintained to ensure every drive is safe, comfortable, and enjoyable. Whether you're visiting the Rockies, heading to a business meeting, or just need a reliable ride while your car is in the shop — we've got you covered.
                </p>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }}>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Users, value: "5,000+", label: "Happy Customers" },
                    { icon: Award, value: "12+", label: "Vehicle Models" },
                    { icon: MapPin, value: "4", label: "Locations" },
                    { icon: Clock, value: "24/7", label: "Support Available" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-card border border-border/50 rounded-xl p-5 text-center">
                      <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-12 px-4 bg-card/30 border-y border-border/30">
          <div className="mx-auto max-w-4xl">
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="bg-card border border-border/50 rounded-2xl p-6">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To provide Calgarians and visitors with a seamless, transparent, and premium car rental experience — backed by a diverse fleet, honest pricing, and exceptional customer service at every step of the journey.
                </p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} viewport={{ once: true }} className="bg-card border border-border/50 rounded-2xl p-6">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Our Vision</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To become Alberta's most trusted mobility platform — where every rental is effortless, every vehicle is exceptional, and every customer feels valued. We envision a future where getting around is always a pleasure, not a hassle.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="py-12 px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-8 text-center">Our Services</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { title: "Daily Rentals", desc: "Flexible daily rentals for short trips, errands, and weekend getaways." },
                { title: "Weekly Rentals", desc: "Extended weekly rates for business trips, relocations, and longer stays." },
                { title: "Airport Pickup", desc: "Convenient pickup and drop-off at Calgary International Airport." },
                { title: "Chauffeur Service", desc: "Professional driver add-on for corporate events and special occasions." },
                { title: "GPS & Navigation", desc: "Modern vehicles equipped with built-in GPS or rental navigation devices." },
                { title: "Insurance Add-ons", desc: "Comprehensive coverage options to give you peace of mind on every trip." },
              ].map((svc, i) => (
                <motion.div
                  key={svc.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  viewport={{ once: true }}
                  className="bg-card border border-border/50 rounded-xl p-5"
                >
                  <h4 className="font-semibold mb-2">{svc.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{svc.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-12 px-4 bg-card/30 border-t border-border/30">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-8 text-center">Why Choose YYC Car Rental?</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {[
                { title: "No Hidden Fees", desc: "Transparent pricing. What you see is what you pay — always." },
                { title: "Premium Fleet", desc: "Every vehicle is regularly inspected, cleaned, and maintained to the highest standards." },
                { title: "Flexible Locations", desc: "Multiple pickup and drop-off locations across Calgary for your convenience." },
                { title: "Easy Booking", desc: "Book in minutes online. Cancel 72+ hours before pick-up with a 1-day fee, or review our policy for late cancellations." },
                { title: "Photo Documentation", desc: "Vehicle condition photos at check-in and check-out protect both you and us." },
                { title: "Dedicated Support", desc: "Our team is always ready to assist you before, during, and after your rental." },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -15 : 15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  viewport={{ once: true }}
                  className="flex gap-3"
                >
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
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
