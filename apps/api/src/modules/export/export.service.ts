import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class ExportService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async exportLeads(
    userId: string,
    leadIds: string[],
    format: 'csv' | 'json' | 'pdf',
  ): Promise<{ content: string; contentType: string; filename: string }> {
    const sb = this.supabaseService.getAdminClient();

    const { data: leads, error } = await sb
      .from('leads')
      .select('*')
      .in('id', leadIds)
      .eq('user_id', userId);

    if (error) throw error;

    if (!leads || leads.length === 0) {
      throw new NotFoundException('No leads found');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    if (format === 'json') {
      return {
        content: JSON.stringify(leads, null, 2),
        contentType: 'application/json',
        filename: `leads-${timestamp}.json`,
      };
    }

    if (format === 'csv') {
      const headers = [
        'title',
        'company',
        'source',
        'location',
        'salary_range',
        'status',
        'source_url',
        'notes',
      ];

      const escapeCSV = (value: unknown): string => {
        const str = value == null ? '' : String(value);
        if (/^[=+\-@\t\r]/.test(str)) {
          return `"'${str.replace(/"/g, '""')}"`;
        }
        if (
          str.includes(',') ||
          str.includes('"') ||
          str.includes('\n') ||
          str.includes('\r')
        ) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const rows = leads.map((lead) =>
        headers.map((h) => escapeCSV(lead[h])).join(','),
      );

      const content = [headers.join(','), ...rows].join('\n');

      return {
        content,
        contentType: 'text/csv',
        filename: `leads-${timestamp}.csv`,
      };
    }

    const lines = leads.map(
      (lead, i) =>
        `${i + 1}. ${lead.title ?? 'Untitled'}\n` +
        `   Company: ${lead.company ?? 'N/A'}\n` +
        `   Location: ${lead.location ?? 'N/A'}\n` +
        `   Salary: ${lead.salary_range ?? 'N/A'}\n` +
        `   Status: ${lead.status ?? 'N/A'}\n` +
        `   URL: ${lead.source_url ?? 'N/A'}\n` +
        `   Notes: ${lead.notes ?? ''}\n`,
    );

    return {
      content: `Leads Export\n${'='.repeat(40)}\n\n${lines.join('\n')}`,
      contentType: 'text/plain',
      filename: `leads-${timestamp}.txt`,
    };
  }
}
