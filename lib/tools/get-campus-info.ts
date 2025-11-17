import { tool } from 'ai';
import { z } from 'zod';
import { db } from '@/app/db/index';
import { sql } from 'drizzle-orm';
import { campus as cam } from '@/app/db/schema';
import { 
  searchSchoolByIpeds, 
  formatCurrency, 
  formatPercent, 
  formatNumber,
  getOwnershipLabel,
} from '@/lib/college-scorecard-client';
import { normalizeHawaiian } from '@/lib/normalize-hawaiian';

export const getCampusInfo = tool({
  description: "Get detailed general information about a UH campus: location, website, student population, costs, admission stats, outcomes. Returns structured data with emoji sections. IMPORTANT: After calling this tool, the LLM should add a brief engaging intro (1-2 sentences) about the campus BEFORE showing the data.",
  inputSchema: z.object({
    campusName: z.string().describe("Name of the campus (e.g., 'Windward Community College', 'UH Manoa')"),
  }),
  execute: async ({ campusName }) => {
    try {
      // Table existence guard for campuses
      const reg = await db.execute(sql`SELECT to_regclass('public.campuses') AS campuses`);
      const first: any = Array.isArray(reg) ? reg[0] : (reg as any).rows?.[0];
      if (!first?.campuses) {
        return {
          found: false,
          message: 'Campus info is not available yet (database not migrated). I can still give a general overview based on public knowledge.',
        };
      }
      // First, lookup campus in DB to get IPEDS ID
      // Use centralized normalization + alias matching
      const campusResult = await db
        .select({
          name: cam.name,
          type: cam.type,
          instIpeds: cam.instIpeds,
          aliases: cam.aliases,
        })
        .from(cam)
        .where(sql`(
          translate(LOWER(${cam.name}), 'āēīōūʻ''''', 'aeiou') LIKE ${`%${normalizeHawaiian(campusName)}%`} OR
          ${cam.aliases}::text ILIKE ${`%${campusName}%`}
        )`)
        .limit(1);

      if (!campusResult?.length) {
        return {
          found: false,
          message: `I couldn't find "${campusName}" in the UH system. Try checking the campus name or use getCampuses to see all available campuses.`,
        };
      }

      const campus = campusResult[0];

      if (!campus.instIpeds) {
        return {
          found: true,
          campusName: campus.name,
          formatted: `**${campus.name}**\n\nDetailed information is not available for this campus yet.`,
        };
      }

      // Fetch from College Scorecard API
      const info = await searchSchoolByIpeds(campus.instIpeds);

      if (!info) {
        return {
          found: true,
          campusName: campus.name,
          formatted: `**${campus.name}**\n\nI couldn't retrieve detailed information right now. Please try again in a moment.`,
        };
      }

      // Build response with available data
      const lines: (string | false | null)[] = [
        `**${info.name}**`,
        '',
      ];

      // Location & Website - full address
      const locationParts = [];
      if (info.city) locationParts.push(info.city);
      if (info.state) locationParts.push(info.state);
      if (info.zip) locationParts.push(info.zip);
      
      if (locationParts.length) {
        lines.push(`📍 **Location:** ${locationParts.join(', ')}`);
      }
      
      const ownershipLabel = getOwnershipLabel(info.ownership);
      if (ownershipLabel) {
        lines.push(`🏛️ **Type:** ${ownershipLabel} ${campus.type ? `(${campus.type.replace('_', ' ')})` : ''}`);
      }
      
      if (info.website) {
        lines.push(`🌐 **Website:** ${info.website}`);
      }
      
      if (locationParts.length || info.website || ownershipLabel) lines.push('');

      // Student Body - only show if there's actual enrollment data
      if (info.size || info.undergradSize) {
        lines.push('👥 **Student Body:**');
        if (info.size) {
          lines.push(`  • Total enrollment: ${formatNumber(info.size)} students`);
        } else if (info.undergradSize) {
          lines.push(`  • Undergraduates: ${formatNumber(info.undergradSize)}`);
        }
        if (info.partTimeShare != null && info.partTimeShare > 0) {
          lines.push(`  • Part-time students: ${formatPercent(info.partTimeShare)}`);
        }
        lines.push('');
      }

      // Costs
      if (info.avgCostPerYear || info.tuitionInState || info.tuitionOutOfState) {
        lines.push('💰 **Costs:**');
        if (info.avgCostPerYear) lines.push(`  • Average net price: ${formatCurrency(info.avgCostPerYear)}/year`);
        if (info.tuitionInState) lines.push(`  • In-state tuition: ${formatCurrency(info.tuitionInState)}/year`);
        if (info.tuitionOutOfState) lines.push(`  • Out-of-state tuition: ${formatCurrency(info.tuitionOutOfState)}/year`);
        lines.push('');
      }

      // Admissions
      if (info.admissionRate || info.satAverage || info.actMedian) {
        lines.push('📊 **Admissions:**');
        if (info.admissionRate) lines.push(`  • Admission rate: ${formatPercent(info.admissionRate)}`);
        if (info.satAverage) lines.push(`  • Average SAT: ${Math.round(info.satAverage)}`);
        if (info.actMedian) lines.push(`  • Median ACT: ${Math.round(info.actMedian)}`);
        lines.push('');
      }

      // Outcomes
      if (info.completionRate || info.retentionRate || info.medianEarnings) {
        lines.push('🎓 **Outcomes:**');
        if (info.retentionRate) lines.push(`  • Retention rate: ${formatPercent(info.retentionRate)}`);
        if (info.completionRate) lines.push(`  • 4-year completion rate: ${formatPercent(info.completionRate)}`);
        if (info.medianEarnings) lines.push(`  • Median earnings (10 yrs after): ${formatCurrency(info.medianEarnings)}`);
        lines.push('');
      }

      // Demographics (only if significant data present)
      const demographics = [
        info.percentWhite && info.percentWhite > 0.01 ? `White: ${formatPercent(info.percentWhite)}` : null,
        info.percentAsian && info.percentAsian > 0.01 ? `Asian: ${formatPercent(info.percentAsian)}` : null,
        info.percentPacificIslander && info.percentPacificIslander > 0.01 ? `Pacific Islander: ${formatPercent(info.percentPacificIslander)}` : null,
        info.percentHispanic && info.percentHispanic > 0.01 ? `Hispanic: ${formatPercent(info.percentHispanic)}` : null,
        info.percentBlack && info.percentBlack > 0.01 ? `Black: ${formatPercent(info.percentBlack)}` : null,
        info.percentNativeAmerican && info.percentNativeAmerican > 0.01 ? `Native American: ${formatPercent(info.percentNativeAmerican)}` : null,
        info.percentTwoOrMore && info.percentTwoOrMore > 0.01 ? `Two or more: ${formatPercent(info.percentTwoOrMore)}` : null,
      ].filter(Boolean);

      if (demographics.length > 0) {
        lines.push('🌈 **Demographics:**');
        demographics.forEach(d => lines.push(`  • ${d}`));
      }

      const response = lines.filter(Boolean).join('\n');
      
      // If we got very little data, add a helpful note
      const finalResponse = lines.length < 8 
        ? response + '\n\n_Limited data available for this campus._'
        : response;

      return {
        found: true,
        campusName: info.name,
        formatted: finalResponse,
        data: info,
      };
    } catch (error) {
      console.error('getCampusInfo error:', error);
      return {
        found: false,
        error: true,
        message: 'I\'m having trouble getting campus information right now. Please try again in a moment.',
      };
    }
  }
});
