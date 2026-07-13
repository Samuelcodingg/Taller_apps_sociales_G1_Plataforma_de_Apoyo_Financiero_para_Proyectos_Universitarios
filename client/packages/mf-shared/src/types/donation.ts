export type Donation = {
  id: string;
  donor: string;
  amount: number;
  anonymous: boolean;
  date: string;
  message?: string;
};
