export function paymentRequired(): {
  name: string;
} {
  return {
    name: 'PaymentRequired',
  };
}
