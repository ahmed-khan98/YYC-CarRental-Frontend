import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/api/users.api.ts";
import { uploadFile } from "@/api/upload.api.ts";
import Navbar from "@/components/navbar.tsx";
import Footer from "@/components/footer.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Authenticated, Unauthenticated, AuthLoading } from "@/components/auth-gate.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { toast } from "sonner";
import { patchText } from "@/lib/patchPayload.ts";
import { motion } from "motion/react";
import { User, Phone, FileText, Upload, CheckCircle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge.tsx";
import { resolveMediaUrl } from "@/lib/mediaUrl.ts";

function ProfileInner() {
  const queryClient = useQueryClient();
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ["users", "me"],
    queryFn: () => usersApi.getCurrentUser(),
  });
  const updateProfile = useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "me"] });
    },
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licensePreview, setLicensePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name ?? "");
      setPhone(currentUser.phone ?? "");
      if (currentUser.licenseUrl && !licenseFile) {
        setLicensePreview(resolveMediaUrl(currentUser.licenseUrl));
      }
    }
  }, [currentUser, licenseFile]);

  const handleLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLicenseFile(file);
    setLicensePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let licenseUrl: string | undefined;
      if (licenseFile) {
        licenseUrl = await uploadFile(licenseFile, "licenses");
      }
      await updateProfile.mutateAsync({
        name: patchText(name),
        phone: patchText(phone),
        licenseUrl,
      });
      setLicenseFile(null);
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-lg">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const isComplete = currentUser?.profileComplete;

  return (
    <div className="mx-auto max-w-xl px-4 py-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
            {currentUser?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{currentUser?.name ?? "My Profile"}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
              <Badge className={isComplete
                ? "bg-primary/20 text-primary border-primary/30 text-xs"
                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs"
              }>
                {isComplete ? "Profile Complete" : "Complete Your Profile"}
              </Badge>
            </div>
          </div>
        </div>

        {!isComplete && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
            <p className="text-sm text-yellow-400">
              Please complete your profile by adding your phone number and uploading your driving license to make bookings smoother.
            </p>
          </div>
        )}
      </motion.div>

      <Card className="border-border/50 bg-card/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Smith" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Phone className="h-3 w-3" /> Phone Number
            </Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 403 000 0000" type="tel" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Driving License
            {currentUser?.licenseUrl && (
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs ml-auto">
                <CheckCircle className="h-3 w-3 mr-1" /> Uploaded
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-border/50 rounded-xl p-5 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {licensePreview ? (
              <div className="relative">
                {licenseFile?.type.startsWith("image/") || (currentUser?.licenseUrl && !licenseFile) ? (
                  <img src={resolveMediaUrl(licensePreview)} alt="License" className="w-full h-40 object-contain rounded-lg" />
                ) : (
                  <div className="h-40 flex items-center justify-center">
                    <FileText className="h-12 w-12 text-primary" />
                    <p className="ml-3 text-sm text-foreground">{licenseFile?.name}</p>
                  </div>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setLicenseFile(null); setLicensePreview(""); if (fileRef.current) fileRef.current.value = ""; }}
                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="py-6 text-muted-foreground">
                <Upload className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Click to upload driving license</p>
                <p className="text-xs mt-0.5">JPG, PNG, or PDF</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleLicenseChange} />
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={loading} className="w-full cursor-pointer" size="lg">
        {loading ? "Saving..." : "Save Profile"}
      </Button>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="pt-16 flex-1">
        <AuthLoading>
          <div className="mx-auto max-w-xl px-4 py-8">
            <Skeleton className="h-8 w-48 mb-6" />
            <Skeleton className="h-48 w-full" />
          </div>
        </AuthLoading>
        <Unauthenticated>
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="border-border/50 text-center py-12 px-8">
              <CardContent>
                <h3 className="text-lg font-semibold mb-2">Sign in to view your profile</h3>
                <SignInButton />
              </CardContent>
            </Card>
          </div>
        </Unauthenticated>
        <Authenticated>
          <ProfileInner />
        </Authenticated>
      </div>
      <Footer />
    </div>
  );
}
