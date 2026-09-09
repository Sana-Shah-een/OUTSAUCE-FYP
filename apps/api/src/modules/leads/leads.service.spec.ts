import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LeadsService } from './leads.service';
import { SupabaseService } from '../../supabase/supabase.service';
import { LeadScoringService } from './lead-scoring.service';

describe('LeadsService', () => {
  let service: LeadsService;
  let mockSupabaseAdmin: any;

  beforeEach(async () => {
    mockSupabaseAdmin = {
      from: jest.fn(),
      rpc: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        {
          provide: SupabaseService,
          useValue: {
            getAdminClient: () => mockSupabaseAdmin,
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: LeadScoringService,
          useValue: {
            scoreLead: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should check and increment lead usage atomically via RPC before inserting', async () => {
      const userId = 'user-1';
      const input = { scrape_result_id: 'sr-1' };

      const mockScrapeResult = {
        id: 'sr-1',
        source: 'linkedin',
        source_url: 'https://example.com',
        title: 'Developer',
        company: 'Acme',
        location: 'Remote',
      };

      const mockLead = { id: 'lead-1', title: 'Developer' };

      mockSupabaseAdmin.from.mockImplementation((table: string) => {
        if (table === 'scrape_results') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockScrapeResult, error: null }),
          };
        }
        if (table === 'subscriptions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { plan: 'free' }, error: null }),
          };
        }
        if (table === 'leads') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockLead, error: null }),
          };
        }
        return {};
      });

      mockSupabaseAdmin.rpc.mockResolvedValue({ error: null });

      const result = await service.create(userId, input as any);

      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith(
        'check_and_increment_lead_usage',
        {
          p_user_id: userId,
          p_count: 1,
          p_limit: 20,
        },
      );
      expect(result).toEqual(mockLead);
    });

    it('should throw ForbiddenException if lead limit is exceeded in RPC', async () => {
      const userId = 'user-1';
      const input = { scrape_result_id: 'sr-1' };

      mockSupabaseAdmin.from.mockImplementation((table: string) => {
        if (table === 'scrape_results') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { id: 'sr-1' }, error: null }),
          };
        }
        if (table === 'subscriptions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { plan: 'free' }, error: null }),
          };
        }
        return {};
      });

      mockSupabaseAdmin.rpc.mockResolvedValue({
        error: { code: 'P0001', message: 'LEAD_LIMIT_EXCEEDED: user user-1 has 20 of 20 leads this period' },
      });

      await expect(service.create(userId, input as any)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('bulkCreate', () => {
    it('should atomically check and increment usage with exact batch count', async () => {
      const userId = 'user-1';
      const input = { scrape_result_ids: ['sr-1', 'sr-2', 'sr-3'] };

      const mockScrapeResults = [
        { id: 'sr-1', source: 'linkedin' },
        { id: 'sr-2', source: 'indeed' },
        { id: 'sr-3', source: 'upwork' },
      ];

      const mockLeads = [
        { id: 'lead-1' },
        { id: 'lead-2' },
        { id: 'lead-3' },
      ];

      mockSupabaseAdmin.from.mockImplementation((table: string) => {
        if (table === 'scrape_results') {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: mockScrapeResults, error: null }),
          };
        }
        if (table === 'subscriptions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { plan: 'starter' }, error: null }),
          };
        }
        if (table === 'leads') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue({ data: mockLeads, error: null }),
          };
        }
        return {};
      });

      mockSupabaseAdmin.rpc.mockResolvedValue({ error: null });

      const result = await service.bulkCreate(userId, input as any);

      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith(
        'check_and_increment_lead_usage',
        {
          p_user_id: userId,
          p_count: 3,
          p_limit: 200,
        },
      );
      expect(result).toEqual(mockLeads);
    });

    it('should reject bulk creation when RPC signals limit exceeded', async () => {
      const userId = 'user-1';
      const input = { scrape_result_ids: ['sr-1', 'sr-2'] };

      mockSupabaseAdmin.from.mockImplementation((table: string) => {
        if (table === 'scrape_results') {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [{ id: 'sr-1' }, { id: 'sr-2' }],
              error: null,
            }),
          };
        }
        if (table === 'subscriptions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { plan: 'free' }, error: null }),
          };
        }
        return {};
      });

      mockSupabaseAdmin.rpc.mockResolvedValue({
        error: { code: 'P0001', message: 'LEAD_LIMIT_EXCEEDED' },
      });

      await expect(service.bulkCreate(userId, input as any)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should handle concurrent bulkCreate invocations correctly via atomic RPC calls', async () => {
      const userId = 'user-1';
      let currentUsed = 15;
      const limit = 20;

      mockSupabaseAdmin.from.mockImplementation((table: string) => {
        if (table === 'scrape_results') {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            eq: jest.fn().mockImplementation(() =>
              Promise.resolve({
                data: Array.from({ length: 3 }, (_, i) => ({ id: `sr-${i}` })),
                error: null,
              }),
            ),
          };
        }
        if (table === 'subscriptions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { plan: 'free' }, error: null }),
          };
        }
        if (table === 'leads') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue({
              data: [{ id: 'l1' }, { id: 'l2' }, { id: 'l3' }],
              error: null,
            }),
          };
        }
        return {};
      });

      mockSupabaseAdmin.rpc.mockImplementation((name: string, args: any) => {
        if (name === 'check_and_increment_lead_usage') {
          if (args.p_limit !== -1 && currentUsed + args.p_count > args.p_limit) {
            return Promise.resolve({
              error: { code: 'P0001', message: 'LEAD_LIMIT_EXCEEDED' },
            });
          }
          currentUsed += args.p_count;
          return Promise.resolve({ error: null });
        }
        return Promise.resolve({ error: null });
      });

      // 4 concurrent calls of batch size 3 (15 + 3 = 18 <= 20 (passes), next 18 + 3 = 21 > 20 (fails))
      const calls = Array.from({ length: 4 }, () =>
        service.bulkCreate(userId, { scrape_result_ids: ['sr-1', 'sr-2', 'sr-3'] }),
      );

      const results = await Promise.allSettled(calls);
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(3);
      expect(currentUsed).toBe(18);
    });
  });
});
