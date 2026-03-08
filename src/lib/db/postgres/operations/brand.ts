import { query, transaction } from '../client';

export interface Brand {
  id: string;
  name: string;
  email: string;
  wallet_balance: number;
  created_at: Date;
}

export const BrandOperations = {
  /**
   * Get brand by ID
   */
  async getById(id: string) {
    const sql = 'SELECT * FROM brands WHERE id = $1';
    const result = await query(sql, [id]);
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      ...row,
      wallet_balance: parseFloat(row.wallet_balance || '0')
    };
  },

  /**
   * Recharge brand wallet
   */
  async rechargeWallet(brandId: string, amount: number) {
    return transaction(async (client) => {
      // 1. Update brand balance
      const updateSql = `
        UPDATE brands 
        SET wallet_balance = COALESCE(wallet_balance, 0) + $1 
        WHERE id = $2 
        RETURNING wallet_balance
      `;
      const result = await client.query(updateSql, [amount, brandId]);
      
      if (result.rows.length === 0) {
        throw new Error('Brand not found');
      }

      // 2. We could also log to a brand_transactions table here in the future
      
      return parseFloat(result.rows[0].wallet_balance);
    });
  }
};
