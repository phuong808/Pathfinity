"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import StepIndicator from "../../components/pathway/step-indicator"
import Career from "@/app/components/pathway/career"
import College from "@/app/components/pathway/college"
import Interests from "@/app/components/pathway/interests"
import Skills from "@/app/components/pathway/skills"
import ProfilePreview from "@/app/components/profiles/profile-preview"
import { Button } from "@/app/components/ui/button"
import { SuccessAlert, WarningAlert, LoadingAlert } from "@/app/components/pathway/pathway-alerts"

type FormData = {
  career: string
  college: string
  program: string
  interests: string[]
  tasks: string
  skills: string[]
  careerValidated?: boolean
}

export default function CreatePathwayPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [generatedInterests, setGeneratedInterests] = useState<string[]>([])
  const [generatedSkills, setGeneratedSkills] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [showWarningAlert, setShowWarningAlert] = useState(false)
  const [form, setForm] = useState<FormData>({
    career: "",
    college: "",
    program: "",
    interests: [],
    tasks: "",
    skills: [],
    careerValidated: false,
  })

  function next() {
    setStep((s) => Math.min(6, s + 1))
  }

  function back() {
    setStep((s) => Math.max(1, s - 1))
  }

  async function handleConfirm() {
    try {
      setIsLoading(true)
      
      const response = await fetch("/api/profiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          career: form.career,
          college: form.college,
          program: form.program,
          interests: form.interests,
          skills: form.skills,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save profile")
      }

      const data = await response.json()
      console.log("Profile saved:", data)

      // Check if roadmap was generated successfully
      if (data.hasRoadmap) {
        setShowSuccessAlert(true)
      } else {
        setShowWarningAlert(true)
      }

      // Redirect to roadmap page after a short delay
      setTimeout(() => {
        router.push("/Roadmaps")
      }, 2500)
    } catch (error) {
      console.error("Error saving profile:", error)
      alert("Failed to save profile. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const nextEnabled =
    step === 1
      ? !!form.careerValidated
      : step === 2
      ? form.college !== "" && form.program !== ""
      : step === 3
      ? form.interests.length > 0
      : step === 4
      ? form.skills.length > 0
      : true

  return (
    <div className="relative min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Loading Alert (when saving / roadmap processing) */}
        {isLoading && (
          <LoadingAlert
            title={"Processing Roadmap..."}
            description={"We're generating your personalized roadmap. This can take a minute."}
          />
        )}

        {/* Success Alert */}
        {showSuccessAlert && (
          <SuccessAlert
            title={"Profile Created Successfully!"}
            description={"Your pathway profile has been saved. Redirecting to roadmap..."}
          />
        )}

        {/* Warning Alert */}
        {showWarningAlert && (
          <WarningAlert
            title={"Profile Saved with Warning"}
            description={"Your profile was created, but we couldn't generate a roadmap. This may be because your campus is not UH Manoa or we don't have a pathway template for your major."}
          />
        )}

        <div className="min-h-[90vh] flex items-center">
          <div className="w-full">
            <div className="flex flex-col md:flex-row gap-12 md:items-stretch">
              {/* Left: form column */}
              <div className="flex-1 h-full overflow-visible">
                <div className="h-full">
                  {step === 1 && <Career form={form} setForm={setForm} />}
                  {step === 2 && <College form={form} setForm={setForm} />}
                  {step === 3 && (
                    <Interests
                      form={form}
                      setForm={setForm}
                      interests={generatedInterests}
                      onInterestsChange={setGeneratedInterests}
                    />
                  )}
                  {step === 4 && (
                    <Skills
                      form={form}
                      setForm={setForm}
                      skills={generatedSkills}
                      onSkillsChange={setGeneratedSkills}
                    />
                  )}
                  {step === 5 && (
                    <div className="flex items-center justify-center">
                      <div className="w-full max-w-2xl">
                        <ProfilePreview
                          career={form.career}
                          college={form.college}
                          program={form.program}
                          interests={form.interests}
                          skills={form.skills}
                          onEdit={(targetStep) => setStep(targetStep)}
                        />
                      </div>
                    </div>
                  )}

                  {/* TODO: Step 6 will be roadmap generation */}
                  {step === 6 && (
                    <div className="mt-6 p-6 bg-white rounded shadow">
                      <h2 className="text-2xl font-semibold mb-3">Success!</h2>
                      <p className="text-gray-700">Your profile has been created.</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Next: Generate roadmap and navigate to dashboard
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: step indicator */}
              <div className="hidden md:flex w-48 h-full">
                <StepIndicator step={step} />
              </div>
            </div>

            {/* Back and Next buttons */}
            <div className="mt-4 flex gap-5 pr-30">
              <Button
                variant="outline"
                className="mr-2"
                onClick={back}
                disabled={step === 1}
              >
                Back
              </Button>

              <div className="flex gap-2">
                {step < 4 ? (
                  <Button
                    onClick={next}
                    className="!bg-green-600 !text-white !border-green-600 hover:!bg-green-700 active:!bg-green-800 focus-visible:!ring-2 focus-visible:!ring-green-300"
                    disabled={!nextEnabled}
                  >
                    Next
                  </Button>
                ) : step === 4 ? (
                  <Button
                    className="!bg-green-600 !text-white !border-green-600 hover:!bg-green-700 active:!bg-green-800 focus-visible:!ring-2 focus-visible:!ring-green-300"
                    onClick={() => setStep(5)}
                    disabled={!nextEnabled || isLoading}
                  >
                    Review
                  </Button>
                ) : step === 5 ? (
                  <Button
                    className="!bg-green-600 !text-white !border-green-600 hover:!bg-green-700 active:!bg-green-800 focus-visible:!ring-2 focus-visible:!ring-green-300"
                    onClick={handleConfirm}
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Confirm & Save"}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
