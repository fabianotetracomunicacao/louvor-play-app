import { supabase } from '../supabaseClient';

export const AsaasService = {
  /**
   * Generates a checkout session/invoice URL for a selected plan
   * @param {string} planId - The ID of the generic plan the user selected
   * @param {string} type - 'individual' | 'church'
   * @param {string} churchId - (Optional) if church subscription
   * @param {object} customerData - Customer details like name, cpfCnpj etc
   * @returns {Promise<{ invoiceUrl: string, subscriptionId: string }>}
   */
  async createSubscription(planId, type, churchId = null, customerData = {}, paymentMethod = 'UNDEFINED', creditCard = null, creditCardHolderInfo = null) {
    try {
      const { data, error } = await supabase.functions.invoke('asaas-checkout', {
        body: {
          planId,
          type,
          churchId,
          customerData,
          paymentMethod,
          creditCard,
          creditCardHolderInfo
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data;
    } catch (error) {
       console.error('Asaas Checkout Error:', error);
       throw new Error(error.message || 'Erro ao processar o pagamento.');
    }
  },

  /**
   * Retrieves the current user or church's subscription details from our database
   */
  async getSubscriptionDetails(subscriptionId) {
      if (!subscriptionId) return null;
      
      try {
          const { data, error } = await supabase
            .from('subscriptions')
            .select('*, plan:plans(*)')
            .eq('id', subscriptionId)
            .single();
            
          if (error) throw error;
          return data;
      } catch (err) {
          console.error('Error fetching subscription:', err);
          return null;
      }
  }
};
