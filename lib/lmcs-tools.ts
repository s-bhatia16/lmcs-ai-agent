import { MOCK_MEMBERS } from "@/data/mock-members";

const MINIMUM_MEMBERSHIP_MONTHS = 3;
const MINIMUM_MONTHLY_ORDINARY_SAVINGS = 5_000;
const LOAN_LIMIT_MULTIPLIER = 3;

function getMember(memberId: string) {
  return MOCK_MEMBERS.find((member) => member.memberId === memberId) ?? null;
}

function completedMembershipMonths(startDate: string) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const today = new Date();

  let months =
    (today.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    today.getUTCMonth() -
    start.getUTCMonth();

  if (today.getUTCDate() < start.getUTCDate()) {
    months -= 1;
  }

  return Math.max(0, months);
}

export function getMemberAccount(memberId: string) {
  const member = getMember(memberId);

  if (!member) {
    return {
      found: false,
      message: "No fictional demonstration member was found for that ID.",
    };
  }

  return {
    found: true,
    member: {
      memberId: member.memberId,
      name: member.name,
      membershipStartDate: member.membershipStartDate,
      ordinarySavings: member.ordinarySavings,
      specialSavings: member.specialSavings,
      retirementSavings: member.retirementSavings,
      shareCapital: member.shareCapital,
      activeLoan: member.activeLoan,
    },
    dataStatus: "Fictional demonstration data",
  };
}

export function calculateLoanEligibility(memberId: string) {
  const member = getMember(memberId);

  if (!member) {
    return {
      found: false,
      message: "No fictional demonstration member was found for that ID.",
    };
  }

  const membershipMonths = completedMembershipMonths(
    member.membershipStartDate
  );
  const recentContributions = member.monthlyOrdinaryContributions.slice(-3);
  const minimumSavingsMet =
    recentContributions.length === 3 &&
    recentContributions.every(
      (contribution) =>
        contribution.amount >= MINIMUM_MONTHLY_ORDINARY_SAVINGS
    );
  const membershipDurationMet =
    membershipMonths >= MINIMUM_MEMBERSHIP_MONTHS;
  const eligibleToRequest = membershipDurationMet && minimumSavingsMet;

  return {
    found: true,
    memberId: member.memberId,
    membershipMonths,
    membershipDurationMet,
    minimumSavingsMet,
    recentMonthlyContributions: recentContributions,
    ordinarySavings: member.ordinarySavings,
    maximumLoanRequest:
      member.ordinarySavings * LOAN_LIMIT_MULTIPLIER,
    normalOneYearRate: "11%",
    loanHandlingChargeRate: "1%",
    eligibleToRequest,
    finalApprovalRequired: true,
    approvalAuthority: "LMCS Management Committee",
    dataStatus: "Fictional demonstration data",
  };
}

export function runLMCSTool(
  toolName: string,
  input: unknown,
  authenticatedDemoMemberId: string
) {
  const requestedMemberId =
    typeof input === "object" &&
    input !== null &&
    "member_id" in input &&
    typeof input.member_id === "string"
      ? input.member_id
      : authenticatedDemoMemberId;

  if (requestedMemberId !== authenticatedDemoMemberId) {
    return {
      error:
        "Access denied. The demo may only retrieve the currently selected fictional member.",
    };
  }

  if (toolName === "get_member_account") {
    return getMemberAccount(requestedMemberId);
  }

  if (toolName === "calculate_loan_eligibility") {
    return calculateLoanEligibility(requestedMemberId);
  }

  return {
    error: "Unknown tool requested.",
  };
}
