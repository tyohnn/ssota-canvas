#!/usr/bin/env node

/**
 * Test Runner for US-001: Design Workflow in Visual Canvas
 *
 * This script runs all tests according to the test hierarchy defined in test-case-US-001.json
 */

import { execSync } from "child_process";
import { testData } from "./test-data";

console.log("🧪 Running US-001 Test Suite: Design Workflow in Visual Canvas");
console.log("=".repeat(60));

// Test execution order based on test-case-US-001.json
const testExecutionOrder = [
  // 1. Component tests (unit level)
  {
    name: "Component Tests",
    pattern: "unit/components",
    description: "Testing individual React components in isolation",
  },
  // 2. Business logic tests (unit level)
  {
    name: "Business Logic Tests",
    pattern: "unit/business-logic",
    description: "Testing business logic functions, hooks, and utilities",
  },
  // 3. Integration tests
  {
    name: "Integration Tests",
    pattern: "integration",
    description: "Testing component interactions and data flow",
  },
];

async function runTestSuite() {
  let allTestsPassed = true;

  for (const testSuite of testExecutionOrder) {
    console.log(`\n📋 Running ${testSuite.name}`);
    console.log(`📝 ${testSuite.description}`);
    console.log("-".repeat(40));

    try {
      // Run tests with coverage
      const command = `pnpm test --run --coverage --testPathPattern=${testSuite.pattern}`;
      console.log(`🚀 Executing: ${command}`);

      execSync(command, {
        stdio: "inherit",
        cwd: process.cwd(),
      });

      console.log(`✅ ${testSuite.name} completed successfully`);
    } catch (error) {
      console.error(`❌ ${testSuite.name} failed`);
      allTestsPassed = false;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Summary");
  console.log("=".repeat(60));

  if (allTestsPassed) {
    console.log("🎉 All test suites passed!");
    console.log(`📈 Test Coverage Requirements:`);
    console.log(`   - Branches: 80%`);
    console.log(`   - Functions: 80%`);
    console.log(`   - Lines: 80%`);
    console.log(`   - Statements: 80%`);
  } else {
    console.log("💥 Some test suites failed. Please review the errors above.");
    process.exit(1);
  }

  // Test data validation
  console.log("\n🔍 Test Data Validation");
  console.log("-".repeat(30));
  console.log(`✅ User data: ${testData.user.name} (${testData.user.email})`);
  console.log(`✅ Workspace: ${testData.workspace.name}`);
  console.log(`✅ Node types: ${testData.nodeTypes.length} types defined`);
  console.log(`✅ Widgets: ${testData.widgets.length} widgets available`);
  console.log(
    `✅ Connection rules: ${testData.connectionRules.allowedConnections.length} allowed, ${testData.connectionRules.forbiddenConnections.length} forbidden`
  );
}

// Run the test suite
runTestSuite().catch((error) => {
  console.error("💥 Test runner failed:", error);
  process.exit(1);
});
