"use client";

/**
 * B2BInquiryForm.tsx
 * ───────────────────────────────────────────────
 * Multi-step B2B wholesale inquiry form with live API submission.
 * Saves directly into the Supabase database via /api/b2b route.
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Package,
  TrendingUp,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Send,
  Loader2,
  AlertCircle,
  Briefcase,
  Weight,
  IndianRupee,
  FileText,
  Check,
  Copy,
  MessageCircle,
} from "lucide-react";

// ─── Types ─────────────────────────────────────
interface FormData {
  // Step 1: Contact
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  designation: string;

  // Step 2: Business
  businessType: string;
  annualVolumeKg: string;
  targetPrice: string;
  varieties: string[];
  deliveryCity: string;
  deliveryState: string;
  deliveryPincode: string;

  // Step 3: Requirements
  packagingType: string;
  deliveryFrequency: string;
  startDate: string;
  contractMonths: string;
  specialRequirements: string;
}

interface FormErrors {
  [key: string]: string;
}

// ─── Constants ─────────────────────────────────
const BUSINESS_TYPES = [
  { value: "RETAIL_CHAIN", label: "Retail Chain / Supermarket", icon: Building2 },
  { value: "HOTEL_RESTAURANT", label: "Hotel / Restaurant / Café", icon: Building2 },
  { value: "EXPORTER", label: "Fruit Exporter", icon: Package },
  { value: "PROCESSOR", label: "Food Processor / Juice Maker", icon: Package },
  { value: "DISTRIBUTOR", label: "Distributor / Wholesaler", icon: TrendingUp },
  { value: "ONLINE_STORE", label: "Online Store / E-commerce", icon: Building2 },
  { value: "OTHER", label: "Other", icon: Briefcase },
];

const APPLE_VARIETIES = [
  { value: "ROYAL_DELICIOUS", label: "Royal Delicious" },
  { value: "RED_DELICIOUS", label: "Red Delicious" },
  { value: "GOLDEN_DELICIOUS", label: "Golden Delicious" },
  { value: "DARK_BARON", label: "Dark Baron (Limited)" },
];

const PACKAGING_TYPES = [
  { value: "CARTON_5KG", label: "Carton — 5 kg" },
  { value: "CARTON_10KG", label: "Carton — 10 kg" },
  { value: "CARTON_15KG", label: "Carton — 15 kg" },
  { value: "WOODEN_CRATE_20KG", label: "Wooden Crate — 20 kg" },
  { value: "CUSTOM", label: "Custom Packaging" },
];

const DELIVERY_FREQUENCIES = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Bi-Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "ON_DEMAND", label: "On Demand" },
];

const STEPS = [
  { number: 1, title: "Contact", description: "Your details" },
  { number: 2, title: "Business", description: "Company info" },
  { number: 3, title: "Requirements", description: "Order specs" },
  { number: 4, title: "Review", description: "Confirm & send" },
];

const WHATSAPP_NUMBER = "919876543210";

// ─── Validation ────────────────────────────────
function validateStep(step: number, data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (step === 1) {
    if (!data.companyName.trim()) errors.companyName = "Company name is required";
    if (!data.contactName.trim()) errors.contactName = "Contact name is required";
    if (!data.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = "Please enter a valid email";
    }
    if (!data.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^[\+]?[0-9\s-]{10,15}$/.test(data.phone.replace(/\s/g, ""))) {
      errors.phone = "Please enter a valid phone number";
    }
  }

  if (step === 2) {
    if (!data.businessType) errors.businessType = "Please select a business type";
    if (!data.annualVolumeKg.trim()) {
      errors.annualVolumeKg = "Annual volume is required";
    } else if (isNaN(Number(data.annualVolumeKg)) || Number(data.annualVolumeKg) <= 0) {
      errors.annualVolumeKg = "Please enter a valid number";
    }
    if (data.targetPrice && (isNaN(Number(data.targetPrice)) || Number(data.targetPrice) <= 0)) {
      errors.targetPrice = "Please enter a valid price";
    }
    if (data.varieties.length === 0) errors.varieties = "Select at least one variety";
    if (!data.deliveryCity.trim()) errors.deliveryCity = "City is required";
    if (!data.deliveryState.trim()) errors.deliveryState = "State is required";
    if (!data.deliveryPincode.trim()) {
      errors.deliveryPincode = "PIN code is required";
    } else if (!/^\d{6}$/.test(data.deliveryPincode)) {
      errors.deliveryPincode = "Please enter a valid 6-digit PIN";
    }
  }

  if (step === 3) {
    if (!data.packagingType) errors.packagingType = "Select packaging type";
    if (!data.deliveryFrequency) errors.deliveryFrequency = "Select delivery frequency";
    if (!data.startDate) errors.startDate = "Select a start date";
    if (!data.contractMonths) {
      errors.contractMonths = "Contract duration is required";
    } else if (isNaN(Number(data.contractMonths)) || Number(data.contractMonths) < 1) {
      errors.contractMonths = "Minimum 1 month";
    }
  }

  return errors;
}

// ─── Step Indicator Component ───────────────────────────
function StepIndicator({
  currentStep,
  completedSteps,
}: {
  currentStep: number;
  completedSteps: number[];
}) {
  return (
    <div className="flex items-center justify-between mb-10">
      {STEPS.map((step, index) => {
        const isActive = step.number === currentStep;
        const isCompleted = completedSteps.includes(step.number);
        const isLast = index === STEPS.length - 1;

        return (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  backgroundColor: isActive
                    ? "#a82626"
                    : isCompleted
                    ? "#16a34a"
                    : "#e7e5e4",
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                  isActive || isCompleted ? "text-white" : "text-mist-500"
                }`}
              >
                {isCompleted && !isActive ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.number
                )}
              </motion.div>
              <span
                className={`text-xs font-medium mt-2 ${
                  isActive ? "text-ruby-700" : "text-mist-500"
                }`}
              >
                {step.title}
              </span>
            </div>
            {!isLast && (
              <div className="flex-1 h-0.5 mx-2 bg-mist-200">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{
                    width: isCompleted ? "100%" : "0%",
                  }}
                  className="h-full bg-emerald-500"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ────────────────────────────
export default function B2BInquiryForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    designation: "",
    businessType: "",
    annualVolumeKg: "",
    targetPrice: "",
    varieties: [],
    deliveryCity: "",
    deliveryState: "",
    deliveryPincode: "",
    packagingType: "CARTON_10KG",
    deliveryFrequency: "MONTHLY",
    startDate: "",
    contractMonths: "12",
    specialRequirements: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [inquiryNumber, setInquiryNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const updateField = useCallback(
    (field: keyof FormData, value: string | string[]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [errors]
  );

  const toggleVariety = useCallback((variety: string) => {
    setFormData((prev) => {
      const varieties = prev.varieties.includes(variety)
        ? prev.varieties.filter((v) => v !== variety)
        : [...prev.varieties, variety];
      return { ...prev, varieties };
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next.varieties;
      return next;
    });
  }, []);

  const handleNext = useCallback(() => {
    const stepErrors = validateStep(currentStep, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setCompletedSteps((prev) =>
      prev.includes(currentStep) ? prev : [...prev, currentStep]
    );
    setCurrentStep((prev) => Math.min(prev + 1, 4));
    setErrors({});
  }, [currentStep, formData]);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setErrors({});
  }, []);

  const handleSubmit = useCallback(async () => {
    const stepErrors = validateStep(currentStep, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setSubmitting(true);
    setApiError(null);

    try {
      const response = await fetch("/api/b2b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: formData.companyName,
          contactName: formData.contactName,
          email: formData.email,
          phone: formData.phone,
          designation: formData.designation,
          businessType: formData.businessType,
          annualVolumeKg: Number(formData.annualVolumeKg),
          targetPrice: formData.targetPrice ? Number(formData.targetPrice) : null,
          varieties: formData.varieties,
          deliveryCity: formData.deliveryCity,
          deliveryState: formData.deliveryState,
          deliveryPincode: formData.deliveryPincode,
          packagingType: formData.packagingType,
          deliveryFrequency: formData.deliveryFrequency,
          startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
          contractMonths: Number(formData.contractMonths),
          specialRequirements: formData.specialRequirements,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Failed to submit B2B inquiry.");
      }

      const generatedNum = resData.inquiryNumber || resData.id || `CHP-B2B-${Date.now().toString().slice(-6)}`;
      setInquiryNumber(generatedNum);
      setSubmitted(true);
    } catch (err: any) {
      console.error("B2B Submission Error:", err);
      setApiError(err.message || "An unexpected error occurred while saving your inquiry.");
    } finally {
      setSubmitting(false);
    }
  }, [currentStep, formData]);

  const copyInquiryNumber = useCallback(() => {
    navigator.clipboard.writeText(inquiryNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [inquiryNumber]);

  const openWhatsApp = useCallback(() => {
    const message = encodeURIComponent(
      `Hi, I just submitted B2B inquiry ${inquiryNumber}. I'd like to discuss further.`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
  }, [inquiryNumber]);

  // ─── Step Renderers ───────────────────────────
  const renderStep1 = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-mist-700 text-sm font-medium mb-2">
            Company Name <span className="text-ruby-500">*</span>
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mist-400" />
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => updateField("companyName", e.target.value)}
              placeholder="e.g., FreshMart India Pvt. Ltd."
              className={`w-full pl-10 pr-4 py-3 bg-mist-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all ${
                errors.companyName
                  ? "border-red-300 focus:ring-red-500/10 focus:border-red-400"
                  : "border-mist-200 focus:ring-ruby-500/10 focus:border-ruby-400"
              }`}
            />
          </div>
          {errors.companyName && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.companyName}
            </p>
          )}
        </div>

        <div>
          <label className="block text-mist-700 text-sm font-medium mb-2">
            Contact Person <span className="text-ruby-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mist-400" />
            <input
              type="text"
              value={formData.contactName}
              onChange={(e) => updateField("contactName", e.target.value)}
              placeholder="Full name"
              className={`w-full pl-10 pr-4 py-3 bg-mist-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all ${
                errors.contactName
                  ? "border-red-300 focus:ring-red-500/10"
                  : "border-mist-200 focus:ring-ruby-500/10 focus:border-ruby-400"
              }`}
            />
          </div>
          {errors.contactName && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.contactName}
            </p>
          )}
        </div>

        <div>
          <label className="block text-mist-700 text-sm font-medium mb-2">
            Email Address <span className="text-ruby-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mist-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="you@company.com"
              className={`w-full pl-10 pr-4 py-3 bg-mist-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all ${
                errors.email
                  ? "border-red-300 focus:ring-red-500/10"
                  : "border-mist-200 focus:ring-ruby-500/10 focus:border-ruby-400"
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.email}
            </p>
          )}
        </div>

        <div>
          <label className="block text-mist-700 text-sm font-medium mb-2">
            Phone Number <span className="text-ruby-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mist-400" />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="+91 98765 43210"
              className={`w-full pl-10 pr-4 py-3 bg-mist-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all ${
                errors.phone
                  ? "border-red-300 focus:ring-red-500/10"
                  : "border-mist-200 focus:ring-ruby-500/10 focus:border-ruby-400"
              }`}
            />
          </div>
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.phone}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-mist-700 text-sm font-medium mb-2">
          Designation (Optional)
        </label>
        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mist-400" />
          <input
            type="text"
            value={formData.designation}
            onChange={(e) => updateField("designation", e.target.value)}
            placeholder="e.g., Procurement Manager"
            className="w-full pl-10 pr-4 py-3 bg-mist-50 border border-mist-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-ruby-500/10 focus:border-ruby-400 transition-all"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <div>
        <label className="block text-mist-700 text-sm font-medium mb-3">
          Business Type <span className="text-ruby-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BUSINESS_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = formData.businessType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => updateField("businessType", type.value)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  isSelected
                    ? "border-ruby-500 bg-ruby-50"
                    : "border-mist-200 bg-mist-50 hover:border-mist-300"
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isSelected ? "text-ruby-600" : "text-mist-400"
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    isSelected ? "text-ruby-900" : "text-mist-700"
                  }`}
                >
                  {type.label}
                </span>
              </button>
            );
          })}
        </div>
        {errors.businessType && (
          <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {errors.businessType}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-mist-700 text-sm font-medium mb-2">
            Annual Volume (kg) <span className="text-ruby-500">*</span>
          </label>
          <div className="relative">
            <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mist-400" />
            <input
              type="number"
              value={formData.annualVolumeKg}
              onChange={(e) => updateField("annualVolumeKg", e.target.value)}
              placeholder="e.g., 5000"
              className={`w-full pl-10 pr-4 py-3 bg-mist-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all ${
                errors.annualVolumeKg
                  ? "border-red-300 focus:ring-red-500/10"
                  : "border-mist-200 focus:ring-ruby-500/10 focus:border-ruby-400"
              }`}
            />
          </div>
          {errors.annualVolumeKg && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.annualVolumeKg}
            </p>
          )}
        </div>

        <div>
          <label className="block text-mist-700 text-sm font-medium mb-2">
            Target Price / kg (₹) <span className="text-mist-400">(Optional)</span>
          </label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mist-400" />
            <input
              type="number"
              value={formData.targetPrice}
              onChange={(e) => updateField("targetPrice", e.target.value)}
              placeholder="e.g., 200"
              className={`w-full pl-10 pr-4 py-3 bg-mist-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all ${
                errors.targetPrice
                  ? "border-red-300 focus:ring-red-500/10"
                  : "border-mist-200 focus:ring-ruby-500/10 focus:border-ruby-400"
              }`}
            />
          </div>
          {errors.targetPrice && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.targetPrice}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-mist-700 text-sm font-medium mb-3">
          Interested Varieties <span className="text-ruby-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {APPLE_VARIETIES.map((variety) => {
            const isSelected = formData.varieties.includes(variety.value);
            return (
              <button
                key={variety.value}
                type="button"
                onClick={() => toggleVariety(variety.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all duration-200 ${
                  isSelected
                    ? "border-ruby-500 bg-ruby-50 text-ruby-700"
                    : "border-mist-200 bg-mist-50 text-mist-600 hover:border-mist-300"
                }`}
              >
                {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                {variety.label}
              </button>
            );
          })}
        </div>
        {errors.varieties && (
          <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {errors.varieties}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label className="block text-mist-700 text-sm font-medium mb-2">
            City <span className="text-ruby-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mist-400" />
            <input
              type="text"
              value={formData.deliveryCity}
              onChange={(e) => updateField("deliveryCity", e.target.value)}
              placeholder="City"
              className={`w-full pl-10 pr-4 py-3 bg-mist-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all ${
                errors.deliveryCity
                  ? "border-red-300 focus:ring-red-500/10"
                  : "border-mist-200 focus:ring-ruby-500/10 focus:border-ruby-400"
              }`}
            />
          </div>
          {errors.deliveryCity && (
            <p className="text-red-500 text-xs mt-1">{errors.deliveryCity}</p>
          )}
        </div>
        <div>
          <label className="block text-mist-700 text-sm font-medium mb-2">
            State <span className="text-ruby-500">*</span>
          </label>
          <input
            type="text"
            value={formData.deliveryState}
            onChange={(e) => updateField("deliveryState", e.target.value)}
            placeholder="State"
            className={`w-full px-4 py-3 bg-mist-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all ${
              errors.deliveryState
                ? "border-red-300 focus:ring-red-500/10"
                : "border-mist-200 focus:ring-ruby-500/10 focus:border-ruby-400"
            }`}
          />
          {errors.deliveryState && (
            <p className="text-red-500 text-xs mt-1">{errors.deliveryState}</p>
          )}
        </div>
        <div>
          <label className="block text-mist-700 text-sm font-medium mb-2">
            PIN Code <span className="text-ruby-500">*</span>
          </label>
          <input
            type="text"
            value={formData.deliveryPincode}
            onChange={(e) => updateField("deliveryPincode", e.target.value)}
            placeholder="6 digits"
            maxLength={6}
            className={`w-full px-4 py-3 bg-mist-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all ${
              errors.deliveryPincode
                ? "border-red-300 focus:ring-red-500/10"
                : "border-mist-200 focus:ring-ruby-500/10 focus:border-ruby-400"
            }`}
          />
          {errors.deliveryPincode && (
            <p className="text-red-500 text-xs mt-1">{errors.deliveryPincode}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      <div>
        <label className="block text-mist-700 text-sm font-medium mb-3">
          Packaging Preference <span className="text-ruby-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PACKAGING_TYPES.map((pkg) => {
            const isSelected = formData.packagingType === pkg.value;
            return (
              <button
                key={pkg.value}
                type="button"
                onClick={() => updateField("packagingType", pkg.value)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  isSelected
                    ? "border-ruby-500 bg-ruby-50"
                    : "border-mist-200 bg-mist-50 hover:border-mist-300"
                }`}
              >
                <Package
                  className={`w-5 h-5 shrink-0 ${
                    isSelected ? "text-ruby-600" : "text-mist-400"
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    isSelected ? "text-ruby-900" : "text-mist-700"
                  }`}
                >
                  {pkg.label}
                </span>
              </button>
            );
          })}
        </div>
        {errors.packagingType && (
          <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {errors.packagingType}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-mist-700 text-sm font-medium mb-2">
            Delivery Frequency <span className="text-ruby-500">*</span>
          </label>
          <select
            value={formData.deliveryFrequency}
            onChange={(e) => updateField("deliveryFrequency", e.target.value)}
            className="w-full px-4 py-3 bg-mist-50 border border-mist-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-ruby-500/10 focus:border-ruby-400 transition-all appearance-none"
          >
            {DELIVERY_FREQUENCIES.map((freq) => (
              <option key={freq.value} value={freq.value}>
                {freq.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-mist-700 text-sm font-medium mb-2">
            Contract Duration (months) <span className="text-ruby-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mist-400" />
            <input
              type="number"
              value={formData.contractMonths}
              onChange={(e) => updateField("contractMonths", e.target.value)}
              min={1}
              max={36}
              className={`w-full pl-10 pr-4 py-3 bg-mist-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all ${
                errors.contractMonths
                  ? "border-red-300 focus:ring-red-500/10"
                  : "border-mist-200 focus:ring-ruby-500/10 focus:border-ruby-400"
              }`}
            />
          </div>
          {errors.contractMonths && (
            <p className="text-red-500 text-xs mt-1">{errors.contractMonths}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-mist-700 text-sm font-medium mb-2">
          Preferred Start Date <span className="text-ruby-500">*</span>
        </label>
        <input
          type="date"
          value={formData.startDate}
          onChange={(e) => updateField("startDate", e.target.value)}
          min={new Date().toISOString().split("T")[0]}
          className={`w-full px-4 py-3 bg-mist-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all ${
            errors.startDate
              ? "border-red-300 focus:ring-red-500/10"
              : "border-mist-200 focus:ring-ruby-500/10 focus:border-ruby-400"
          }`}
        />
        {errors.startDate && (
          <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>
        )}
      </div>

      <div>
        <label className="block text-mist-700 text-sm font-medium mb-2">
          Special Requirements{" "}
          <span className="text-mist-400">(Optional)</span>
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 w-4 h-4 text-mist-400" />
          <textarea
            value={formData.specialRequirements}
            onChange={(e) => updateField("specialRequirements", e.target.value)}
            placeholder="Any specific requirements: organic certification, custom labeling, temperature requirements, etc."
            rows={4}
            className="w-full pl-10 pr-4 py-3 bg-mist-50 border border-mist-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-ruby-500/10 focus:border-ruby-400 transition-all resize-none"
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="bg-mist-50 rounded-2xl p-6 border border-mist-200">
        <h3 className="font-semibold text-mist-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          Review Your Inquiry
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReviewItem label="Company" value={formData.companyName} icon={Building2} />
            <ReviewItem label="Contact" value={formData.contactName} icon={User} />
            <ReviewItem label="Email" value={formData.email} icon={Mail} />
            <ReviewItem label="Phone" value={formData.phone} icon={Phone} />
          </div>

          <div className="border-t border-mist-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ReviewItem
                label="Business Type"
                value={
                  BUSINESS_TYPES.find((t) => t.value === formData.businessType)
                    ?.label || formData.businessType
                }
                icon={Briefcase}
              />
              <ReviewItem
                label="Annual Volume"
                value={`${Number(formData.annualVolumeKg).toLocaleString("en-IN")} kg`}
                icon={Weight}
              />
              <ReviewItem
                label="Target Price"
                value={
                  formData.targetPrice
                    ? `₹${Number(formData.targetPrice).toLocaleString("en-IN")}/kg`
                    : "Not specified"
                }
                icon={IndianRupee}
              />
              <ReviewItem
                label="Varieties"
                value={formData.varieties
                  .map(
                    (v) => APPLE_VARIETIES.find((av) => av.value === v)?.label || v
                  )
                  .join(", ")}
                icon={Package}
              />
            </div>
          </div>

          <div className="border-t border-mist-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ReviewItem
                label="Delivery Location"
                value={`${formData.deliveryCity}, ${formData.deliveryState} — ${formData.deliveryPincode}`}
                icon={MapPin}
              />
              <ReviewItem
                label="Packaging"
                value={
                  PACKAGING_TYPES.find((p) => p.value === formData.packagingType)
                    ?.label || formData.packagingType
                }
                icon={Package}
              />
              <ReviewItem
                label="Frequency"
                value={
                  DELIVERY_FREQUENCIES.find(
                    (f) => f.value === formData.deliveryFrequency
                  )?.label || formData.deliveryFrequency
                }
                icon={Calendar}
              />
              <ReviewItem
                label="Contract"
                value={`${formData.contractMonths} months from ${
                  formData.startDate
                    ? new Date(formData.startDate).toLocaleDateString("en-IN")
                    : "N/A"
                }`}
                icon={Calendar}
              />
            </div>
          </div>

          {formData.specialRequirements && (
            <div className="border-t border-mist-200 pt-4">
              <ReviewItem
                label="Special Requirements"
                value={formData.specialRequirements}
                icon={FileText}
              />
            </div>
          )}
        </div>
      </div>

      {apiError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <p>{apiError}</p>
        </div>
      )}
    </div>
  );

  function ReviewItem({
    label,
    value,
    icon: Icon,
  }: {
    label: string;
    value: string;
    icon: React.ElementType;
  }) {
    return (
      <div className="flex items-start gap-3">
        <Icon className="w-4 h-4 text-mist-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-mist-500 text-xs">{label}</p>
          <p className="text-mist-900 text-sm font-medium">{value}</p>
        </div>
      </div>
    );
  }

  // ─── Success View ─────────────────────────────
  if (submitted) {
    return (
      <section id="b2b" className="py-24 px-6 md:px-12 bg-mist-50">
        <div className="mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl p-8 md:p-12 border border-mist-200 text-center"
          >
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <h2 className="font-serif text-3xl font-bold text-mist-900 mb-3">
              Inquiry Submitted!
            </h2>
            <p className="text-mist-600 mb-6">
              Thank you for your interest. Our team will review your requirements
              and get back to you within 24 hours.
            </p>

            <div className="bg-mist-50 rounded-xl p-4 mb-8 inline-block">
              <p className="text-mist-500 text-xs uppercase tracking-wider mb-1">
                Inquiry Number
              </p>
              <div className="flex items-center gap-3">
                <span className="text-mist-900 text-xl font-bold font-mono">
                  {inquiryNumber}
                </span>
                <button
                  type="button"
                  onClick={copyInquiryNumber}
                  className="p-2 hover:bg-mist-200 rounded-lg transition-colors"
                  title="Copy inquiry number"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-mist-500" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={openWhatsApp}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all duration-300 flex items-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Discuss on WhatsApp
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setCurrentStep(1);
                  setCompletedSteps([]);
                  setFormData({
                    companyName: "",
                    contactName: "",
                    email: "",
                    phone: "",
                    designation: "",
                    businessType: "",
                    annualVolumeKg: "",
                    targetPrice: "",
                    varieties: [],
                    deliveryCity: "",
                    deliveryState: "",
                    deliveryPincode: "",
                    packagingType: "CARTON_10KG",
                    deliveryFrequency: "MONTHLY",
                    startDate: "",
                    contractMonths: "12",
                    specialRequirements: "",
                  });
                }}
                className="px-6 py-3 bg-mist-100 hover:bg-mist-200 text-mist-700 font-semibold rounded-xl transition-all duration-300"
              >
                Submit Another Inquiry
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  // ─── Main Form View ───────────────────────────
  return (
    <section id="b2b" className="py-24 px-6 md:px-12 bg-mist-50">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <span className="text-ruby-700 text-sm font-semibold uppercase tracking-widest mb-3 block">
            Wholesale
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-mist-900 mb-4">
            B2B Inquiry
          </h2>
          <p className="text-mist-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Partner with us for premium Himalayan apples. Tell us your
            requirements and we&apos;ll craft a custom supply solution.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-3xl p-6 md:p-10 border border-mist-200 shadow-sm"
        >
          <StepIndicator
            currentStep={currentStep}
            completedSteps={completedSteps}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-mist-100">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                currentStep === 1
                  ? "text-mist-300 cursor-not-allowed"
                  : "text-mist-600 hover:bg-mist-100"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-ruby-700 hover:bg-ruby-600 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-ruby-700/20 text-sm"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-mist-400 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-emerald-600/20 text-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Inquiry
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}