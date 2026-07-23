export type MockMember = {
  memberId: string;
  name: string;
  membershipStartDate: string;
  ordinarySavings: number;
  specialSavings: number;
  retirementSavings: number;
  shareCapital: number;
  monthlyOrdinaryContributions: Array<{
    month: string;
    amount: number;
  }>;
  activeLoan: null | {
    product: string;
    outstandingBalance: number;
  };
};

export const MOCK_MEMBERS: MockMember[] = [
  {
    memberId: "LMCS-1042",
    name: "Chinedu Okafor",
    membershipStartDate: "2025-11-15",
    ordinarySavings: 420_000,
    specialSavings: 85_000,
    retirementSavings: 60_000,
    shareCapital: 160_000,
    monthlyOrdinaryContributions: [
      { month: "2026-02", amount: 20_000 },
      { month: "2026-03", amount: 20_000 },
      { month: "2026-04", amount: 20_000 },
      { month: "2026-05", amount: 20_000 },
      { month: "2026-06", amount: 20_000 },
      { month: "2026-07", amount: 20_000 },
    ],
    activeLoan: null,
  },
];
