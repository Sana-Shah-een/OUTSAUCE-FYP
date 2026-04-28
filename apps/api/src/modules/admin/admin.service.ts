import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import * as path from 'path';

@Injectable()
export class AdminService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private get supabase() {
    return this.supabaseService.getAdminClient();
  }

  async getPlatformAnalytics() {
    const [
      { count: usersCount },
      { count: leadsCount },
      { count: scrapesCount },
    ] = await Promise.all([
      this.supabase.from('profiles').select('*', { count: 'exact', head: true }),
      this.supabase.from('leads').select('*', { count: 'exact', head: true }),
      this.supabase.from('scrape_jobs').select('*', { count: 'exact', head: true }),
    ]);

    return {
      totalUsers: usersCount || 0,
      totalLeadsSaved: leadsCount || 0,
      totalScrapesRun: scrapesCount || 0,
    };
  }

  async getUsers() {
    const { data, error } = await this.supabase
      .from('profiles')
      .select(`
        id, 
        email, 
        full_name, 
        user_type, 
        created_at, 
        is_admin,
        subscriptions(plan)
      `)
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);

    return data.map(user => ({
      ...user,
      plan: user.subscriptions?.[0]?.plan || 'free'
    }));
  }

  async getBillingOverview() {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select('plan');

    if (error) throw new InternalServerErrorException(error.message);

    const distribution = {
      free: 0,
      starter: 0,
      pro: 0,
      enterprise: 0,
    };

    let estimatedMrr = 0;
    const PLAN_PRICES = { starter: 19, pro: 49, enterprise: 99 };

    data.forEach((sub) => {
      const tier = sub.plan as keyof typeof distribution;
      if (distribution[tier] !== undefined) {
        distribution[tier]++;
      }

      const priceKey = sub.plan as keyof typeof PLAN_PRICES;
      if (PLAN_PRICES[priceKey]) {
        estimatedMrr += PLAN_PRICES[priceKey];
      }
    });

    return { estimatedMrr, distribution };
  }

  async getScrapingHealth() {
    const { data, error } = await this.supabase
      .from('scrape_jobs')
      .select('status, sources, created_at');

    if (error) throw new InternalServerErrorException(error.message);

    const stats = {
      total: data.length,
      completed: 0,
      failed: 0,
      running: 0,
    };

    data.forEach((job) => {
      if (job.status === 'completed') stats.completed++;
      if (job.status === 'failed') stats.failed++;
      if (job.status === 'running') stats.running++;
    });

    return stats;
  }

  async getAiUsage() {
    const { data, error } = await this.supabase
      .from('ai_generations')
      .select('tool_type, created_at');

    if (error) throw new InternalServerErrorException(error.message);

    const byTool: Record<string, number> = {};
    data.forEach((gen) => {
      byTool[gen.tool_type] = (byTool[gen.tool_type] || 0) + 1;
    });

    return {
      totalGenerations: data.length,
      byTool,
    };
  }

  async getContactSubmissions() {
    const { data, error } = await this.supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') return [];
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  async createUser(email: string, fullName: string, password?: string) {
    const { data: authUser, error: authError } = await this.supabase.auth.admin.createUser({
      email,
      password: password || 'Outsauce123!',
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (authError) throw new InternalServerErrorException(authError.message);

    await this.supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', authUser.user.id);

    return authUser.user;
  }

  async updateUser(userId: string, updates: { fullName?: string; isAdmin?: boolean; userType?: string }) {
    const { error } = await this.supabase
      .from('profiles')
      .update({
        full_name: updates.fullName,
        is_admin: updates.isAdmin,
        user_type: updates.userType
      })
      .eq('id', userId);

    if (error) throw new InternalServerErrorException(error.message);
    return { success: true };
  }

  async deleteUser(userId: string) {
    const { error } = await this.supabase.auth.admin.deleteUser(userId);
    if (error) throw new InternalServerErrorException(error.message);
    return { success: true };
  }

  async updateUserPlan(userId: string, plan: string) {
    const allowed = ['free', 'starter', 'pro', 'enterprise'];
    if (!allowed.includes(plan)) {
      throw new InternalServerErrorException(
        `Invalid plan "${plan}". Must be one of: ${allowed.join(', ')}`,
      );
    }

    const { data: existing } = await this.supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      const { error } = await this.supabase
        .from('subscriptions')
        .update({ plan })
        .eq('user_id', userId);
      if (error) throw new InternalServerErrorException(error.message);
    } else {
      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const { error } = await this.supabase.from('subscriptions').insert({
        user_id: userId,
        plan,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      });
      if (error) throw new InternalServerErrorException(error.message);
    }

    return { success: true };
  }

  async toggleContactRead(id: string, isRead: boolean) {
    const { error } = await this.supabase
      .from('contact_submissions')
      .update({ is_read: isRead })
      .eq('id', id);

    if (error) throw new InternalServerErrorException(error.message);
    return { success: true };
  }

  async deleteContactSubmission(id: string) {
    const { error } = await this.supabase
      .from('contact_submissions')
      .delete()
      .eq('id', id);

    if (error) throw new InternalServerErrorException(error.message);
    return { success: true };
  }

  async replyToContact(id: string, message: string) {
    const { data: submission, error: fetchError } = await this.supabase
      .from('contact_submissions')
      .select('email, name, subject, message')
      .eq('id', id)
      .single();

    if (fetchError || !submission) throw new InternalServerErrorException('Submission not found');

    await this.toggleContactRead(id, true);

    dotenv.config({ path: path.resolve(process.cwd(), '../../supabase/.env') });

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      throw new InternalServerErrorException('SMTP credentials are not configured in the environment');
    }

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"OutSauce Support" <${smtpUser}>`,
        to: submission.email,
        subject: `Re: ${submission.subject || 'Your Support Request'}`,
        text: message,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
            <h2 style="color: #C41E1E;">Reply from OutSauce Support</h2>
            <p style="white-space: pre-wrap;">${message}</p>
            <br/>
            <p>Best regards,<br/>The OutSauce Team</p>
            <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
            <p style="font-size: 12px; color: #666;">
              <strong>Your original message:</strong><br />
              <em style="white-space: pre-wrap;">${submission.message}</em>
            </p>
          </div>
        `,
      });

      console.log(`[ADMIN REPLY] Successfully sent to: ${submission.email}`);
    } catch (emailError) {
      console.error('[ADMIN REPLY] Error sending email:', emailError);
      throw new InternalServerErrorException('Failed to send the reply email. Please check SMTP configuration.');
    }
    
    return { 
      success: true, 
      recipient: submission.email,
      sentAt: new Date().toISOString()
    };
  }
}
