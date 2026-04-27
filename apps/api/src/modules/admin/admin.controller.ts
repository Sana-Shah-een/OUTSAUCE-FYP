import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('admin')
@UseGuards(SupabaseAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('analytics')
  async getAnalytics() {
    return this.adminService.getPlatformAnalytics();
  }

  @Get('users')
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Post('users')
  async createUser(@Body() body: { email: string; fullName: string; password?: string }) {
    return this.adminService.createUser(body.email, body.fullName, body.password);
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: { fullName?: string; isAdmin?: boolean; userType?: string }
  ) {
    return this.adminService.updateUser(id, body);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Patch('users/:id/plan')
  async updatePlan(@Param('id') id: string, @Body() body: { plan: string }) {
    return this.adminService.updateUserPlan(id, body.plan);
  }

  @Get('billing')
  async getBilling() {
    return this.adminService.getBillingOverview();
  }

  @Get('scrapes')
  async getScrapes() {
    return this.adminService.getScrapingHealth();
  }

  @Get('ai')
  async getAiUsage() {
    return this.adminService.getAiUsage();
  }

  @Get('contact')
  async getContactSubmissions() {
    return this.adminService.getContactSubmissions();
  }

  @Patch('contact/:id/read')
  async toggleContactRead(@Param('id') id: string, @Body() body: { isRead: boolean }) {
    return this.adminService.toggleContactRead(id, body.isRead);
  }

  @Delete('contact/:id')
  async deleteContactSubmission(@Param('id') id: string) {
    return this.adminService.deleteContactSubmission(id);
  }

  @Post('contact/:id/reply')
  async replyToContact(@Param('id') id: string, @Body() body: { message: string }) {
    return this.adminService.replyToContact(id, body.message);
  }
}

