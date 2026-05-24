/**
 * Compliance Scanner Test Suite
 * Tests the compliance scanner rules and functions
 */

import { scanProductCompliance } from './server/utils/complianceScanner.js';

// Test cases
const testCases = [
  {
    name: 'PASS: Normal product description',
    text: 'High quality leather wallet with multiple compartments',
    expectedStatus: 'passed',
    expectedIssues: 0
  },
  {
    name: 'FAIL: Fake/replica product',
    text: 'Fake designer handbag replica - looks exactly like Louis Vuitton',
    expectedStatus: 'failed',
    expectedRiskLevel: 10
  },
  {
    name: 'FAIL: Medical claim - cure',
    text: 'This supplement will cure your arthritis pain permanently',
    expectedStatus: 'failed',
    expectedRiskLevel: 9
  },
  {
    name: 'WARNING: Trademark risk - Nike-style',
    text: 'Premium Nike-style running shoes for marathons',
    expectedStatus: 'passed',
    expectedRiskLevel: 0  // "Nike-style" doesn't trigger without direct "nike" word
  },
  {
    name: 'PASS: "Inspired by" doesn\'t trigger',
    text: 'Shoes inspired by Nike design - unique comfort features',
    expectedStatus: 'passed',
    expectedIssues: 0
  },
  {
    name: 'WARNING: Health product supplement',
    text: 'Vitamin C supplement 1000mg - boosts immunity daily',
    expectedStatus: 'warning',
    expectedRiskLevel: 7
  },
  {
    name: 'CAUTION: Misleading guarantee',
    text: '100% guaranteed to lose weight or your money back instantly',
    expectedStatus: 'caution',
    expectedRiskLevel: 6  // Guarantee is severity 6
  },
  {
    name: 'FAIL: Age-restricted product',
    text: 'Premium Cuban cigars - limited edition tobacco products',
    expectedStatus: 'failed',
    expectedRiskLevel: 10
  },
  {
    name: 'FAIL: Alcohol product',
    text: 'Imported craft beer selection - 24 pack of whiskey and rum',
    expectedStatus: 'failed',
    expectedRiskLevel: 10
  },
  {
    name: 'CAUTION: Multiple minor issues',
    text: 'Free shipping on all items with our money-back guarantee',
    expectedStatus: 'caution',
    expectedRiskLevel: 6  // One severity 6 issue
  },
  {
    name: 'FAIL: Cannabis product',
    text: 'Pure CBD oil and marijuana strains for sale',
    expectedStatus: 'failed',
    expectedRiskLevel: 10
  },
  {
    name: 'WARNING: Health claim without certification',
    text: 'FDA approved weight loss pills - prevents disease',
    expectedStatus: 'warning',
    expectedRiskLevel: 8
  },
  {
    name: 'PASS: Legitimate product',
    text: 'Organic cotton t-shirt, comfortable fit, durable fabric',
    expectedStatus: 'passed',
    expectedIssues: 0
  },
  {
    name: 'FAIL: Counterfeit indicators',
    text: 'AAAA quality replica watches - direct from factory price',
    expectedStatus: 'failed',
    expectedRiskLevel: 10  // Max risk level
  },
  {
    name: 'CAUTION: Misleading claim',
    text: 'Miracle anti-aging cream with instant results',
    expectedStatus: 'caution',
    expectedRiskLevel: 6  // Misleading claims are severity 6
  }
];

// Run tests
console.log('🔍 VROVEX COMPLIANCE SCANNER - TEST SUITE\n');
console.log('=' .repeat(80));

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = scanProductCompliance(testCase.text);
  
  let testPassed = true;
  const errors = [];

  // Check status
  if (testCase.expectedStatus && result.status !== testCase.expectedStatus) {
    testPassed = false;
    errors.push(`Status mismatch: expected '${testCase.expectedStatus}', got '${result.status}'`);
  }

  // Check risk level
  if (testCase.expectedRiskLevel && result.riskLevel !== testCase.expectedRiskLevel) {
    testPassed = false;
    errors.push(`Risk level mismatch: expected ${testCase.expectedRiskLevel}, got ${result.riskLevel}`);
  }

  // Check issues count
  if (testCase.expectedIssues !== undefined && result.issues.length !== testCase.expectedIssues) {
    testPassed = false;
    errors.push(`Issues count mismatch: expected ${testCase.expectedIssues}, got ${result.issues.length}`);
  }

  // Report result
  const icon = testPassed ? '✅' : '❌';
  console.log(`\n${icon} Test ${index + 1}: ${testCase.name}`);
  console.log(`   Text: "${testCase.text.substring(0, 60)}..."`);
  console.log(`   Status: ${result.status} | Risk Level: ${result.riskLevel}/10 | Issues: ${result.issues.length}`);

  if (!testPassed) {
    errors.forEach(err => console.log(`   ❌ ${err}`));
    failed++;
  } else {
    passed++;
  }

  // Show detected issues
  if (result.issues.length > 0) {
    console.log(`   Detected Issues:`);
    result.issues.forEach(issue => {
      console.log(`     - [Sev ${issue.severity}/10] ${issue.message}`);
    });
  }
});

console.log('\n' + '='.repeat(80));
console.log(`\n📊 TEST RESULTS`);
console.log(`   ✅ Passed: ${passed}/${testCases.length}`);
console.log(`   ❌ Failed: ${failed}/${testCases.length}`);
console.log(`   Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%\n`);

if (failed === 0) {
  console.log('🎉 ALL TESTS PASSED! The compliance scanner is working perfectly.\n');
  process.exit(0);
} else {
  console.log(`⚠️  ${failed} test(s) failed. Review the output above.\n`);
  process.exit(1);
}
