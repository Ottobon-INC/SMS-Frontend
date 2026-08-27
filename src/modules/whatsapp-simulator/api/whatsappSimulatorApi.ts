import { apiGet, apiDelete, apiPost } from '../../../api/client/apiClient';
import { SimulatorMessage } from '../types';

export const whatsappSimulatorApi = {
  async getMessages(): Promise<SimulatorMessage[]> {
    return apiGet<SimulatorMessage[]>('/whatsapp-simulator/messages');
  },

  async clearMessages(): Promise<{ status: string }> {
    return apiDelete<{ status: string }>('/whatsapp-simulator/messages');
  },

  async sendParentWebhookReply(fromPhone: string, bodyText: string): Promise<any> {
    const webhookPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WHATSAPP_SIMULATOR_ACCOUNT',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '15550345678',
                  phone_number_id: 'SIMULATOR_PHONE_ID',
                },
                contacts: [
                  {
                    profile: { name: 'Parent/Guardian User' },
                    wa_id: fromPhone.replace(/[^0-9]/g, ''),
                  },
                ],
                messages: [
                  {
                    from: fromPhone.replace(/[^0-9]/g, ''),
                    id: `wamid.user.${Date.now()}`,
                    timestamp: `${Math.floor(Date.now() / 1000)}`,
                    type: 'text',
                    text: { body: bodyText },
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    return apiPost<any>('/whatsapp/webhook', webhookPayload);
  },

  async triggerSampleTemplate(templateName: string, targetPhone: string = '+919876543210'): Promise<any> {
    const sampleParamsMap: Record<string, string[]> = {
      exam_results_published_v1: [
        'Sai Kiran Varma',
        'Mid-Term Examinations 2026',
        '2026-08-20',
        '  • Mathematics: 85/100 -> PASSED\n  • Physics: 72/100 -> PASSED',
        '325 / 400',
        '81.3',
        'PASSED (Passed All Subjects)',
        'Main Campus',
      ],
      single_student_correction_v1: [
        'Sai Kiran Varma',
        'Mid-Term Examinations 2026',
        '2026-08-20',
        '  • Mathematics: 95/100 -> PASSED',
        '335 / 400',
        '83.8',
        'PASSED (Passed All Subjects)',
        'Main Campus',
      ],
      fee_payment_receipt_v1: [
        'Sai Kiran Varma',
        'Term 1 Tuition Fee',
        'REC-2026-0891',
        '2026-08-18',
        '15,000',
        'UPI (Ref: 987612345)',
        '5,000',
        'Main Campus',
      ],
      attendance_absent_v1: [
        'Sai Kiran Varma',
        'MPC-A',
        '2026-08-18',
        'Main Campus',
      ],
    };

    const params = sampleParamsMap[templateName] || ['Sample Student', 'Main Campus'];

    const payload = {
      messaging_product: 'whatsapp',
      to: targetPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: params.map((p) => ({ type: 'text', text: p })),
          },
        ],
      },
    };

    return apiPost<any>('/whatsapp-simulator/outbound', payload);
  },
};
