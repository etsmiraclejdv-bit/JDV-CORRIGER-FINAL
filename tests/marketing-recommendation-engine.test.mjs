import test from "node:test";
import assert from "node:assert/strict";
import { generateMarketingRecommendations } from "../src/lib/marketing/recommendationEngine.ts";

const completeMetrics = {
  storefrontConversionRatePct: 5,
  profileCompletenessPct: 100,
  qualifiedVisits: 100,
  repeatCustomerRatePct: 35,
  recentReviews: 4,
};

test("returns deterministic, sorted recommendations", () => {
  const first = generateMarketingRecommendations(completeMetrics);
  const second = generateMarketingRecommendations(completeMetrics);
  assert.deepEqual(first, second);
  assert.deepEqual(first.map((item) => item.score), [...first.map((item) => item.score)].sort((a, b) => b - a));
});

test("missing metrics recommend measurement rather than inventing results", () => {
  const recommendations = generateMarketingRecommendations({
    storefrontConversionRatePct: null,
    profileCompletenessPct: null,
    qualifiedVisits: null,
    repeatCustomerRatePct: null,
    recentReviews: null,
  });
  assert.ok(recommendations.some((item) => item.id === "instrument-conversion"));
  assert.ok(recommendations.some((item) => item.id === "measure-retention"));
});

test("low conversion only triggers after sufficient qualified visits", () => {
  const recommendations = generateMarketingRecommendations({
    ...completeMetrics,
    storefrontConversionRatePct: 1,
    qualifiedVisits: 29,
  });
  assert.ok(!recommendations.some((item) => item.id === "improve-storefront-conversion"));
});

test("low conversion triggers with sufficient visits", () => {
  const recommendations = generateMarketingRecommendations({
    ...completeMetrics,
    storefrontConversionRatePct: 1,
    qualifiedVisits: 30,
  });
  assert.ok(recommendations.some((item) => item.id === "improve-storefront-conversion"));
});

test("negative and extreme numeric inputs are handled safely", () => {
  const recommendations = generateMarketingRecommendations({
    storefrontConversionRatePct: -10,
    profileCompletenessPct: 150,
    qualifiedVisits: -20,
    repeatCustomerRatePct: -1,
    recentReviews: -2,
  });
  assert.ok(recommendations.some((item) => item.id === "strengthen-retention"));
  assert.ok(recommendations.some((item) => item.id === "request-customer-feedback"));
  assert.ok(!recommendations.some((item) => item.id === "improve-storefront-conversion"));
});
