import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Upload,
  Loader2,
  ArrowLeft,
  Building2,
  GraduationCap,
  Briefcase,
  Users,
  Heart,
  Shield,
  Landmark,
  FileText,
  MapPin,
  Target,
  TrendingUp,
  ClipboardList,
  CalendarDays,
  Hash,
  UserRound,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import companyLogo from "@/assets/logo.png";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

const formSchema = z.object({
  openPosition: z.string().min(1, "Please select a position"),
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits").max(15),
  currentSalary: z.string().min(1, "Current/Last salary is required"),
  currentBenefits: z.string().min(1, "Current/Last benefits are required"),
  expectedSalary: z.string().min(1, "Expected salary is required"),
  noticePeriod: z.string().min(1, "Notice period is required"),
});

type FormData = z.infer<typeof formSchema>;

interface PositionDetails {
  id: string;
  name: string;
  description?: string;
  company?: string;
  educationalQualification?: string;
  positionType?: string;
  department?: string;
  benefitGroupLife?: string;
  benefitMedicalInsurance?: string;
  benefitPension?: string;
  jobLocation?: string;
  recruitmentType?: string;
  noOfVacancies?: string;
  reportingTo?: string;
  leaveDays?: string;
  requiredQualification?: string;
  requiredExperience?: string;
  keySkills?: string;
  sixMonthObjectives?: string;
  careerPath?: string;
}

// Normalize a field name so emoji prefixes / punctuation don't break matching
// e.g. "🎓 Educational Qualification" -> "educational qualification"
const normalizeFieldName = (name?: string): string =>
  (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// Helper to extract custom field value
const getCustomFieldValue = (task: any, fieldName: string): string | undefined => {
  const target = normalizeFieldName(fieldName);
  const field = task.custom_fields?.find((f: any) => normalizeFieldName(f.name) === target);
  if (!field) return undefined;

  // Handle dropdown type fields
  if (field.type === "drop_down" && field.type_config?.options) {
    const selectedOption = field.type_config.options.find((opt: any) => opt.orderindex === field.value);
    return selectedOption?.name;
  }

  // Handle labels type fields (value is an array of option ids -> resolve to labels)
  if (field.type === "labels" && Array.isArray(field.value)) {
    const options = field.type_config?.options || [];
    return field.value
      .map((id: any) => options.find((opt: any) => opt.id === id)?.label ?? id)
      .join(", ");
  }

  return field.value?.toString();
};

const parsePositionFromTask = (task: any): PositionDetails => ({
  id: task.id,
  name: task.name,
  description: task.description || task.text_content,
  company: getCustomFieldValue(task, "Company"),
  educationalQualification: getCustomFieldValue(task, "Educational Qualification"),
  positionType: getCustomFieldValue(task, "Position Type"),
  department: getCustomFieldValue(task, "Department"),
  benefitGroupLife: getCustomFieldValue(task, "Benefit | Group Life"),
  benefitMedicalInsurance: getCustomFieldValue(task, "Benefit | Medical Insurance"),
  benefitPension: getCustomFieldValue(task, "Benefit | Pension"),
  jobLocation: getCustomFieldValue(task, "Job Location"),
  recruitmentType: getCustomFieldValue(task, "Recruitment Type"),
  noOfVacancies: getCustomFieldValue(task, "No. of Vacancies"),
  reportingTo: getCustomFieldValue(task, "Reporting To"),
  leaveDays: getCustomFieldValue(task, "Leave Days"),
  requiredQualification: getCustomFieldValue(task, "Required Qualification"),
  requiredExperience: getCustomFieldValue(task, "Required Experience"),
  keySkills: getCustomFieldValue(task, "Key Skills"),
  sixMonthObjectives: getCustomFieldValue(task, "6 Months Objectives"),
  careerPath: getCustomFieldValue(task, "Potential Career Path"),
});

// Small presentational helpers for the details modal
const SectionTitle = ({ icon: Icon, children }: { icon: any; children: React.ReactNode }) => (
  <div className="flex items-center gap-2 text-primary mb-3">
    <Icon className="h-5 w-5" />
    <h4 className="font-semibold text-base">{children}</h4>
  </div>
);

const DetailItem = ({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
      <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
        <p className="font-semibold text-foreground mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
};

const JobApplicationForm = () => {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<PositionDetails | null>(null);
  const [descriptionModalPosition, setDescriptionModalPosition] = useState<PositionDetails | null>(null);

  // "Accepted" is orderindex 0 for each approval dropdown; "active" is a task status.
  const customFieldsQuery = encodeURIComponent(
    JSON.stringify([
      // HR Responsible Approval = Accepted
      { field_id: "60cb38bc-57dc-44e5-bbda-d498c3955768", operator: "=", value: "0" },
      // HR Head Approval = Accepted
      { field_id: "40cab41a-1d5b-4806-a7e9-87736e41dacd", operator: "=", value: "0" },
      // Director Approval = Accepted
      { field_id: "4989effc-f4e7-4be5-b695-2005ef408071", operator: "=", value: "0" },
    ]),
  );

  const { data: positionsResponse, isLoading: isLoadingPositions } = useApi<any>({
    url: `https://api.clickup.com/api/v2/list/901218900166/task?custom_fields=${customFieldsQuery}&statuses%5B%5D=active`,
    queryKey: ["job-positions"],
    headers: {
      Authorization: import.meta.env.VITE_CLICKUP_API_TOKEN,
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const positions: PositionDetails[] = positionsResponse?.tasks
    ? positionsResponse.tasks.map(parsePositionFromTask).filter((p: PositionDetails) => p.id && p.name)
    : [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "resume" | "photo") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (type === "resume") {
      if (!ACCEPTED_RESUME_TYPES.includes(file.type)) {
        toast.error("Please upload a valid document file (PDF, DOC, DOCX)");
        e.target.value = "";
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error("File size must be less than 5MB");
        e.target.value = "";
        return;
      }
      setResumeFile(file);
      toast.success("Resume file uploaded successfully");
    } else {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast.error("Please upload a valid image file (JPG, JPEG, PNG)");
        e.target.value = "";
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error("File size must be less than 5MB");
        e.target.value = "";
        return;
      }
      setPhotoFile(file);
      toast.success("Photo uploaded successfully");
    }
  };

  const handlePositionSelect = (position: PositionDetails) => {
    setSelectedPosition(position);
    setValue("openPosition", position.id);
  };

  const handleBack = () => {
    setSelectedPosition(null);
    reset();
    setResumeFile(null);
    setPhotoFile(null);
  };

  const onSubmit = async (data: FormData) => {
    if (!resumeFile) {
      toast.error("Please upload your resume file");
      return;
    }
    if (!photoFile) {
      toast.error("Please upload your photo");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("openPosition", data.openPosition);
      formData.append("fullName", data.fullName);
      formData.append("email", data.email);
      formData.append("mobile", data.mobile);
      formData.append("currentSalary", data.currentSalary);
      formData.append("currentBenefits", data.currentBenefits);
      formData.append("expectedSalary", data.expectedSalary);
      formData.append("noticePeriod", data.noticePeriod);
      formData.append("resumeFile", resumeFile);
      formData.append("photo", photoFile);

      const credentials = btoa("talentstream:hrtalentstream123");
      const headers = {
        Authorization: `Basic ${credentials}`,
      };

      const urls = ["https://aidapt.app.n8n.cloud/webhook/7027dae8-cde1-437e-8ae0-083f2acf97b1"];

      const responses = await Promise.all(
        urls.map((url) =>
          fetch(url, {
            method: "POST",
            headers,
            body: formData,
          }),
        ),
      );

      const allSuccessful = responses.every((res) => res.ok);

      if (allSuccessful) {
        toast.success("Application submitted successfully!");
        handleBack();
      } else {
        const failedResponses = responses.filter((res) => !res.ok);
        console.error("Failed submissions:", failedResponses);
        toast.error("Submission failed. Please try again.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit application. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show position cards if no position selected
  if (!selectedPosition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Company Header */}
          <div className="flex flex-col items-center mb-12">
            <div className="mb-6 p-3 bg-card rounded-2xl shadow-lg border border-border/50">
              <img
                src={companyLogo}
                alt="Aidapt"
                className="h-20 w-auto object-contain"
              />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-3 tracking-tight text-center">Open Positions</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-center">
              Discover your next opportunity. Click on a position to learn more and apply.
            </p>
          </div>

          {isLoadingPositions ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
              </div>
              <span className="mt-4 text-muted-foreground">Loading positions...</span>
            </div>
          ) : positions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {positions.map((position) => (
                <Card
                  key={position.id}
                  onClick={() => handlePositionSelect(position)}
                  className="group cursor-pointer bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardHeader className="pb-3 relative">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                        {position.name}
                      </CardTitle>
                    </div>
                    {position.company && (
                      <CardDescription className="flex items-center gap-2 mt-2 text-muted-foreground">
                        <Building2 className="h-4 w-4 flex-shrink-0 text-primary/70" />
                        <span className="truncate">{position.company}</span>
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4 relative">
                    <div className="flex flex-wrap gap-2">
                      {position.positionType && (
                        <Badge className="bg-primary/10 text-primary border-0 hover:bg-primary/20">
                          <Briefcase className="h-3 w-3 mr-1.5" />
                          {position.positionType}
                        </Badge>
                      )}
                      {position.department && (
                        <Badge variant="outline" className="border-border/50 text-muted-foreground">
                          <Users className="h-3 w-3 mr-1.5" />
                          {position.department}
                        </Badge>
                      )}
                    </div>
                    {position.requiredQualification && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <GraduationCap className="h-4 w-4 flex-shrink-0 text-primary/70" />
                        <span className="truncate">{position.requiredQualification}</span>
                      </div>
                    )}
                    {position.educationalQualification && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <GraduationCap className="h-4 w-4 flex-shrink-0 text-primary/70" />
                        <span className="truncate">{position.educationalQualification}</span>
                      </div>
                    )}
                    {position.requiredExperience && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 flex-shrink-0 text-primary/70" />
                        <span className="truncate">{position.requiredExperience} experience</span>
                      </div>
                    )}
                    {position.keySkills &&
                      (() => {
                        const skills = position.keySkills
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean);
                        if (skills.length === 0) return null;
                        const shown = skills.slice(0, 4);
                        const remaining = skills.length - shown.length;
                        return (
                          <div className="space-y-1.5">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground/70 font-medium flex items-center gap-1.5">
                              <CheckCircle2 className="h-3 w-3 text-primary/70" />
                              Key Skills
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {shown.map((skill) => (
                                <Badge
                                  key={skill}
                                  variant="outline"
                                  className="border-border/50 text-muted-foreground text-xs font-normal"
                                >
                                  {skill}
                                </Badge>
                              ))}
                              {remaining > 0 && (
                                <Badge
                                  variant="outline"
                                  className="border-border/50 text-muted-foreground text-xs font-normal"
                                >
                                  +{remaining}
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                  </CardContent>
                  <div className="px-6 pb-4 mt-auto">
                    <div className="flex items-center justify-between text-sm text-primary font-medium group-hover:translate-x-1 transition-transform">
                      <span>View Details</span>
                      <ArrowLeft className="h-4 w-4 rotate-180" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg">No open positions available at the moment.</p>
              <p className="text-muted-foreground/70 text-sm mt-1">Please check back later.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show position details and application form
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Company Logo Header */}
        <div className="flex justify-center mb-8">
          <div className="p-3 bg-card rounded-2xl shadow-lg border border-border/50">
            <img
              src={companyLogo}
              alt="Aidapt"
              className="h-16 w-auto object-contain"
            />
          </div>
        </div>
        
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to positions
        </Button>

        {/* Position Details Card */}
        <Card className="mb-8 bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-foreground">{selectedPosition.name}</CardTitle>
                {selectedPosition.company && (
                  <CardDescription className="flex items-center gap-2 text-base text-muted-foreground">
                    <Building2 className="h-4 w-4 text-primary/70" />
                    {selectedPosition.company}
                  </CardDescription>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDescriptionModalPosition(selectedPosition)}
                className="border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 shrink-0"
              >
                <FileText className="h-4 w-4 mr-2" />
                Read Full Description
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {selectedPosition.department && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/30 border border-border/30">
                  <div className="p-2 rounded-md bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Department</p>
                    <p className="font-semibold text-foreground mt-0.5">{selectedPosition.department}</p>
                  </div>
                </div>
              )}
              {selectedPosition.positionType && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/30 border border-border/30">
                  <div className="p-2 rounded-md bg-primary/10">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Position Type</p>
                    <p className="font-semibold text-foreground mt-0.5">{selectedPosition.positionType}</p>
                  </div>
                </div>
              )}
              {selectedPosition.educationalQualification && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/30 border border-border/30 sm:col-span-2">
                  <div className="p-2 rounded-md bg-primary/10">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                      Educational Qualification
                    </p>
                    <p className="font-semibold text-foreground mt-0.5">{selectedPosition.educationalQualification}</p>
                  </div>
                </div>
              )}
            </div>

            {(selectedPosition.benefitGroupLife ||
              selectedPosition.benefitMedicalInsurance ||
              selectedPosition.benefitPension) && (
              <div className="pt-4 border-t border-border/30">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">
                  Benefits Package
                </p>
                <div className="flex flex-wrap gap-3">
                  {selectedPosition.benefitGroupLife && (
                    <div className="flex items-center gap-2 bg-gradient-to-r from-primary/15 to-primary/5 px-4 py-2.5 rounded-full border border-primary/20">
                      <Heart className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        Group Life: {selectedPosition.benefitGroupLife}
                      </span>
                    </div>
                  )}
                  {selectedPosition.benefitMedicalInsurance && (
                    <div className="flex items-center gap-2 bg-gradient-to-r from-primary/15 to-primary/5 px-4 py-2.5 rounded-full border border-primary/20">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        Medical: {selectedPosition.benefitMedicalInsurance}
                      </span>
                    </div>
                  )}
                  {selectedPosition.benefitPension && (
                    <div className="flex items-center gap-2 bg-gradient-to-r from-primary/15 to-primary/5 px-4 py-2.5 rounded-full border border-primary/20">
                      <Landmark className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        Pension: {selectedPosition.benefitPension}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Description Modal */}
        <Dialog open={!!descriptionModalPosition} onOpenChange={() => setDescriptionModalPosition(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border/50">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">{descriptionModalPosition?.name}</DialogTitle>
              {descriptionModalPosition?.company && (
                <DialogDescription className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4 text-primary/70" />
                  {descriptionModalPosition.company}
                </DialogDescription>
              )}
            </DialogHeader>

            <div className="mt-4 space-y-8">
              {/* Overview */}
              <section>
                <SectionTitle icon={Briefcase}>Overview</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DetailItem icon={Users} label="Department" value={descriptionModalPosition?.department} />
                  <DetailItem icon={Briefcase} label="Position Type" value={descriptionModalPosition?.positionType} />
                  <DetailItem icon={FileText} label="Recruitment Type" value={descriptionModalPosition?.recruitmentType} />
                  <DetailItem icon={MapPin} label="Location" value={descriptionModalPosition?.jobLocation} />
                  <DetailItem icon={Hash} label="Openings" value={descriptionModalPosition?.noOfVacancies} />
                  <DetailItem icon={UserRound} label="Reporting To" value={descriptionModalPosition?.reportingTo} />
                </div>
              </section>

              {/* Job Description (only when a free-text description exists) */}
              {descriptionModalPosition?.description && (
                <section>
                  <SectionTitle icon={FileText}>Job Description</SectionTitle>
                  <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed p-4 bg-secondary/30 rounded-lg border border-border/30">
                    {descriptionModalPosition.description}
                  </div>
                </section>
              )}

              {/* What you'll focus on */}
              {descriptionModalPosition?.sixMonthObjectives && (
                <section>
                  <SectionTitle icon={Target}>What You&apos;ll Focus On (First 6 Months)</SectionTitle>
                  <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed p-4 bg-secondary/30 rounded-lg border border-border/30">
                    {descriptionModalPosition.sixMonthObjectives}
                  </div>
                </section>
              )}

              {/* Requirements */}
              {(descriptionModalPosition?.requiredQualification ||
                descriptionModalPosition?.educationalQualification ||
                descriptionModalPosition?.requiredExperience ||
                descriptionModalPosition?.keySkills) && (
                <section>
                  <SectionTitle icon={ClipboardList}>Requirements</SectionTitle>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <DetailItem
                        icon={GraduationCap}
                        label="Required Qualification"
                        value={descriptionModalPosition?.requiredQualification}
                      />
                      <DetailItem
                        icon={GraduationCap}
                        label="Educational Qualification"
                        value={descriptionModalPosition?.educationalQualification}
                      />
                      <DetailItem
                        icon={Briefcase}
                        label="Required Experience"
                        value={descriptionModalPosition?.requiredExperience}
                      />
                    </div>
                    {descriptionModalPosition?.keySkills && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
                        <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
                            Key Skills
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {descriptionModalPosition.keySkills
                              .split(",")
                              .map((skill) => skill.trim())
                              .filter(Boolean)
                              .map((skill) => (
                                <Badge
                                  key={skill}
                                  className="bg-primary/10 text-primary border-0 hover:bg-primary/20"
                                >
                                  {skill}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Career growth */}
              {descriptionModalPosition?.careerPath && (
                <section>
                  <SectionTitle icon={TrendingUp}>Career Growth</SectionTitle>
                  <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed p-4 bg-secondary/30 rounded-lg border border-border/30">
                    {descriptionModalPosition.careerPath}
                  </div>
                </section>
              )}

              {/* Benefits & leave */}
              {(descriptionModalPosition?.leaveDays ||
                descriptionModalPosition?.benefitGroupLife ||
                descriptionModalPosition?.benefitMedicalInsurance ||
                descriptionModalPosition?.benefitPension) && (
                <section>
                  <SectionTitle icon={Heart}>Benefits &amp; Leave</SectionTitle>
                  <div className="flex flex-wrap gap-3">
                    {descriptionModalPosition?.leaveDays && (
                      <div className="flex items-center gap-2 bg-gradient-to-r from-primary/15 to-primary/5 px-4 py-2.5 rounded-full border border-primary/20">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">
                          Leave: {descriptionModalPosition.leaveDays}
                        </span>
                      </div>
                    )}
                    {descriptionModalPosition?.benefitGroupLife && (
                      <div className="flex items-center gap-2 bg-gradient-to-r from-primary/15 to-primary/5 px-4 py-2.5 rounded-full border border-primary/20">
                        <Heart className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">
                          Group Life: {descriptionModalPosition.benefitGroupLife}
                        </span>
                      </div>
                    )}
                    {descriptionModalPosition?.benefitMedicalInsurance && (
                      <div className="flex items-center gap-2 bg-gradient-to-r from-primary/15 to-primary/5 px-4 py-2.5 rounded-full border border-primary/20">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">
                          Medical: {descriptionModalPosition.benefitMedicalInsurance}
                        </span>
                      </div>
                    )}
                    {descriptionModalPosition?.benefitPension && (
                      <div className="flex items-center gap-2 bg-gradient-to-r from-primary/15 to-primary/5 px-4 py-2.5 rounded-full border border-primary/20">
                        <Landmark className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">
                          Pension: {descriptionModalPosition.benefitPension}
                        </span>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => setDescriptionModalPosition(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Application Form */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground">Apply for this Position</CardTitle>
            <CardDescription>Fill out the form below to submit your application</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-foreground font-medium">
                  Candidates Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  {...register("fullName")}
                  className="bg-input border-border text-foreground"
                  placeholder="Enter full name"
                />
                {errors.fullName && <p className="text-destructive text-sm">{errors.fullName.message}</p>}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">
                  Candidates Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  className="bg-input border-border text-foreground"
                  placeholder="Enter email address"
                />
                {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
              </div>

              {/* Mobile */}
              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-foreground font-medium">
                  Candidates Mobile <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="mobile"
                  {...register("mobile")}
                  className="bg-input border-border text-foreground"
                  placeholder="Enter mobile number"
                />
                {errors.mobile && <p className="text-destructive text-sm">{errors.mobile.message}</p>}
              </div>

              {/* Salary Section */}
              <div className="space-y-4 p-4 bg-secondary/20 rounded-lg border border-border/30">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Salary Information (PKR)</p>
                
                {/* Current/Last Salary */}
                <div className="space-y-2">
                  <Label htmlFor="currentSalary" className="text-foreground font-medium">
                    Current / Last Salary Received (PKR) <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">PKR</span>
                    <Input
                      id="currentSalary"
                      {...register("currentSalary")}
                      className="bg-input border-border text-foreground pl-12"
                      placeholder="e.g. 150,000"
                    />
                  </div>
                  {errors.currentSalary && <p className="text-destructive text-sm">{errors.currentSalary.message}</p>}
                </div>

                {/* Expected Salary */}
                <div className="space-y-2">
                  <Label htmlFor="expectedSalary" className="text-foreground font-medium">
                    Expected Salary (PKR) <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">PKR</span>
                    <Input
                      id="expectedSalary"
                      {...register("expectedSalary")}
                      className="bg-input border-border text-foreground pl-12"
                      placeholder="e.g. 200,000"
                    />
                  </div>
                  {errors.expectedSalary && <p className="text-destructive text-sm">{errors.expectedSalary.message}</p>}
                </div>
              </div>

              {/* Current/Last Benefits */}
              <div className="space-y-2">
                <Label htmlFor="currentBenefits" className="text-foreground font-medium">
                  Current / Last Benefits Received <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="currentBenefits"
                  {...register("currentBenefits")}
                  className="bg-input border-border text-foreground min-h-[100px]"
                  placeholder="Enter current/last benefits"
                />
                {errors.currentBenefits && <p className="text-destructive text-sm">{errors.currentBenefits.message}</p>}
              </div>

              {/* Notice Period */}
              <div className="space-y-2">
                <Label htmlFor="noticePeriod" className="text-foreground font-medium">
                  Notice Period (Days) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="noticePeriod"
                  {...register("noticePeriod")}
                  className="bg-input border-border text-foreground"
                  placeholder="Enter notice period in days"
                />
                {errors.noticePeriod && <p className="text-destructive text-sm">{errors.noticePeriod.message}</p>}
              </div>

              {/* Resume File */}
              <div className="space-y-2">
                <Label htmlFor="resumeFile" className="text-foreground font-medium">
                  Resume File <span className="text-destructive">*</span>
                </Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <input
                    id="resumeFile"
                    type="file"
                    onChange={(e) => handleFileChange(e, "resume")}
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                  />
                  <label htmlFor="resumeFile" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Drop files here or <span className="text-primary hover:underline">browse</span>
                    </p>
                    {resumeFile && (
                      <div className="mt-3 p-3 bg-primary/10 rounded-md">
                        <p className="text-foreground font-medium text-sm">✓ {resumeFile.name}</p>
                        <p className="text-muted-foreground text-xs mt-1">
                          {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Photo */}
              <div className="space-y-2">
                <Label htmlFor="photo" className="text-foreground font-medium">
                  Passport Size Color Photo <span className="text-destructive">*</span>
                </Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <input
                    id="photo"
                    type="file"
                    onChange={(e) => handleFileChange(e, "photo")}
                    className="hidden"
                    accept="image/jpeg,image/jpg,image/png"
                  />
                  <label htmlFor="photo" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Drop files here or <span className="text-primary hover:underline">browse</span>
                    </p>
                    {photoFile && (
                      <div className="mt-3 p-3 bg-primary/10 rounded-md">
                        <img
                          src={URL.createObjectURL(photoFile)}
                          alt="Photo preview"
                          className="w-24 h-24 object-cover rounded-md mx-auto mb-2"
                        />
                        <p className="text-foreground font-medium text-sm">✓ {photoFile.name}</p>
                        <p className="text-muted-foreground text-xs mt-1">
                          {(photoFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>


              <Button
                type="submit"
                disabled={isSubmitting || !resumeFile || !photoFile}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JobApplicationForm;
