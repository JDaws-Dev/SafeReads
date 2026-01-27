"use client";

import { useState } from "react";
import * as Slider from "@radix-ui/react-slider";

const SENSITIVITY_FIELDS = [
  { key: "violence", label: "Violence", description: "Fighting, weapons, gore" },
  { key: "language", label: "Language", description: "Profanity, slurs, crude humor" },
  {
    key: "sexualContent",
    label: "Sexual Content",
    description: "Romantic scenes, nudity, sexual references",
  },
  {
    key: "substanceUse",
    label: "Substance Use",
    description: "Alcohol, drugs, tobacco",
  },
  {
    key: "darkThemes",
    label: "Dark Themes",
    description: "Death, abuse, trauma, mental health",
  },
  {
    key: "religiousSensitivity",
    label: "Religious Sensitivity",
    description: "Religious themes, occult, blasphemy",
  },
] as const;

type SensitivityKey = (typeof SENSITIVITY_FIELDS)[number]["key"];

export type SensitivityValues = Record<SensitivityKey, number>;

interface ValuesProfileFormProps {
  initialName?: string;
  initialValues?: SensitivityValues;
  onSubmit: (name: string, values: SensitivityValues) => void;
  submitLabel?: string;
  loading?: boolean;
}

const DEFAULT_VALUES: SensitivityValues = {
  violence: 5,
  language: 5,
  sexualContent: 5,
  substanceUse: 5,
  darkThemes: 5,
  religiousSensitivity: 5,
};

function sensitivityLabel(value: number): string {
  if (value <= 2) return "Very Relaxed";
  if (value <= 4) return "Relaxed";
  if (value <= 6) return "Moderate";
  if (value <= 8) return "Strict";
  return "Very Strict";
}

export function ValuesProfileForm({
  initialName = "",
  initialValues,
  onSubmit,
  submitLabel = "Save Profile",
  loading = false,
}: ValuesProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [values, setValues] = useState<SensitivityValues>(
    initialValues ?? DEFAULT_VALUES
  );

  function handleSliderChange(key: SensitivityKey, newValue: number[]) {
    setValues((prev) => ({ ...prev, [key]: newValue[0] }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="profile-name"
          className="block text-sm font-medium text-ink-700"
        >
          Profile Name
        </label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='e.g. "Ages 8-12" or "Teen Reader"'
          required
          className="mt-1 block w-full rounded-lg border border-parchment-200 bg-white px-3 py-2 text-ink-900 placeholder:text-ink-400 focus:border-parchment-500 focus:outline-none focus:ring-2 focus:ring-parchment-500/20"
        />
      </div>

      <div className="space-y-5">
        <h3 className="font-serif text-lg font-bold text-ink-800">
          Sensitivity Settings
        </h3>
        <p className="text-sm text-ink-500">
          Adjust each slider from 1 (very relaxed) to 10 (very strict) to match
          your comfort level.
        </p>

        {SENSITIVITY_FIELDS.map((field) => (
          <div key={field.key}>
            <div className="mb-2 flex items-baseline justify-between">
              <label className="text-sm font-medium text-ink-700">
                {field.label}
              </label>
              <span className="text-xs text-ink-500">
                {values[field.key]} — {sensitivityLabel(values[field.key])}
              </span>
            </div>
            <p className="mb-2 text-xs text-ink-400">{field.description}</p>
            <Slider.Root
              className="relative flex h-5 w-full touch-none select-none items-center"
              value={[values[field.key]]}
              onValueChange={(v) => handleSliderChange(field.key, v)}
              min={1}
              max={10}
              step={1}
            >
              <Slider.Track className="relative h-1.5 grow rounded-full bg-parchment-200">
                <Slider.Range className="absolute h-full rounded-full bg-parchment-600" />
              </Slider.Track>
              <Slider.Thumb
                className="block h-4 w-4 rounded-full border-2 border-parchment-600 bg-white shadow focus:outline-none focus:ring-2 focus:ring-parchment-500/40"
                aria-label={field.label}
              />
            </Slider.Root>
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="w-full rounded-lg bg-parchment-700 px-4 py-2.5 text-sm font-medium text-parchment-50 transition-colors hover:bg-parchment-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
