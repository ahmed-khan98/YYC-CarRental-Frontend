import { useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/navbar.tsx";
import Footer from "@/components/footer.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Authenticated, Unauthenticated } from "@/components/auth-gate.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { BookingForm } from "@/components/booking-form/booking-form.tsx";
import { ArrowLeft, Car } from "lucide-react";

export default function BookPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="pt-[4.5rem] flex-1">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors cursor-pointer text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Car className="h-7 w-7 text-primary" /> Book Your Ride
            </h1>
            <p className="text-muted-foreground mt-1">Complete your reservation below</p>
          </div>

          <Unauthenticated>
            <Card className="border-border/50 text-center py-12">
              <CardContent>
                <h3 className="text-lg font-semibold mb-2">Sign in to book</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  You need an account to make a reservation.
                </p>
                <SignInButton />
              </CardContent>
            </Card>
          </Unauthenticated>

          <Authenticated>
            {id && <BookingForm carId={id} />}
          </Authenticated>
        </div>
      </div>
      <Footer />
    </div>
  );
}
