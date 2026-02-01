"use client";

import { Button } from "@workspace/ui/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/ui/card";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { Section } from "./Section";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "For personal exploration.",
    features: [
      "100 Agent actions / month",
      "Standard Templates",
      "Canvas View only",
      "3 Active Boards",
    ],
    cta: "Start for free",
    variant: "outline" as const,
  },
  {
    name: "Plus",
    price: "$20",
    description: "For serious researchers.",
    features: [
      "Unlimited Agent actions",
      "All 100+ Templates",
      "Table & Kanban Views",
      "Unlimited Boards",
    ],
    cta: "Start your big thing",
    variant: "default" as const,
    popular: true,
  },
  {
    name: "Pro",
    price: "$50",
    description: "For power users & teams.",
    features: [
      "Everything in Plus",
      "Team Collaboration",
      "API Access",
      "Advanced Exports (PDF/PPT)",
    ],
    cta: "Contact Sales",
    variant: "outline" as const,
  },
];

export function PricingSection() {
  return (
    <Section className="bg-background py-20" id="pricing">
      <div className="flex flex-col items-center mb-16 text-center">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
          Invest in structure.
        </h2>
        <p className="text-lg text-muted-foreground">
          Stop paying for summarizers. Start paying for outcomes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto w-full items-start">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="h-full"
          >
            <Card className={`h-full flex flex-col ${plan.popular ? 'border-primary shadow-lg scale-105 z-10' : 'shadow-md'}`}>
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant={plan.variant} size="lg">
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
