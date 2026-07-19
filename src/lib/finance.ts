export function calculateBalanceDelta(amount: number, type: string, category: string): number {
    const numAmount = Number(amount) || 0;
    
    // User requested: salary(+), loan_taken(-), loan_given(+), loan_repayment(+)
    if (category === 'salary') return numAmount;
    if (category === 'loan_taken') return -numAmount;
    if (category === 'loan_given') return numAmount;
    if (category === 'loan_repayment') return numAmount;

    // Any other transaction category should NOT affect the user's personal balance
    // because it doesn't represent an income/expense specifically for their personal account statement.
    return 0;
}
