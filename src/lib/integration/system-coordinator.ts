/**
 * System Coordinator
 * Task 15.1: Complete system integration
 * 
 * Coordinates all system components and manages the complete workflow
 * from photo upload to earnings credit
 */

import { logger } from '@/lib/logger';
import { analyzeShelfPhoto } from '@/lib/vision/bedrock-client';
import { campaignMatcher } from '@/lib/services/campaign-matcher';
import { ShelfSpaceOperations } from '@/lib/db/postgres/operations/shelf-space';
import { ShopkeeperOperations } from '@/lib/db/postgres/operations/shopkeeper';

export interface WorkflowContext {
  shopkeeperId: string;
  phoneNumber: string;
  timezone: string;
  language: string;
  location?: string;
}

export interface WorkflowResult {
  success: boolean;
  message: string;
  data?: {
    shelfSpaceId?: string;
    emptySpaces?: number;
    campaignMatched?: boolean;
    taskId?: string;
    earnings?: number;
    [key: string]: unknown;
  };
}

/**
 * System Coordinator Class
 * Orchestrates the complete daily workflow
 */
export class SystemCoordinator {
  /**
   * Complete daily workflow
   * Orchestrates the entire process from photo to earnings
   */
  async completeDailyWorkflow(
    photoUrl: string,
    context: WorkflowContext
  ): Promise<WorkflowResult> {
    logger.info('Starting daily workflow', {
      shopkeeperId: context.shopkeeperId,
      photoUrl,
    });

    try {
      // Step 1: Photo analysis with Bedrock Vision
      logger.info('Step 1: Analyzing shelf photo with Bedrock');
      const analysisResult = await analyzeShelfPhoto(photoUrl, 'image/jpeg');

      if (!analysisResult || !analysisResult.emptySpaces || analysisResult.emptySpaces.length === 0) {
        return {
          success: false,
          message: 'No empty shelf spaces detected. Please try again with a clearer photo.',
          data: {
            analysisConfidence: analysisResult?.analysisConfidence || 0,
          },
        };
      }

      // Step 2: Store shelf space analysis
      logger.info('Step 2: Storing shelf space analysis');
      const shopkeeper = await ShopkeeperOperations.getByShopkeeperId(context.shopkeeperId);
      
      const mappedEmptySpaces = analysisResult.emptySpaces.map((space: any) => ({
        ...space,
        shelf_level: space.shelfLevel,
      }));

      const shelfSpace = await ShelfSpaceOperations.create(
        shopkeeper.id,
        photoUrl,
        mappedEmptySpaces,
        (analysisResult.currentInventory as any) || [],
        analysisResult.analysisConfidence || 85
      );

      // Step 3: Campaign matching
      logger.info('Step 3: Matching campaign');
      const location = context.location || shopkeeper.store_address.split(',')[0].trim();
      
      const matchResult = await campaignMatcher.matchCampaign(
        shopkeeper.id,
        shelfSpace.id,
        location,
        mappedEmptySpaces
      );

      if (!matchResult.matched) {
        return {
          success: true,
          message: matchResult.reason || 'No campaigns available at the moment. Check back later!',
          data: {
            shelfSpaceId: shelfSpace.id,
            emptySpaces: analysisResult.emptySpaces.length,
            campaignMatched: false,
          },
        };
      }

      // Step 4: Task assigned - awaiting completion
      logger.info('Step 4: Task assigned, awaiting completion', {
        taskId: matchResult.taskId,
        earnings: matchResult.earnings,
      });

      return {
        success: true,
        message: `Great! You've been matched with ${matchResult.campaign?.brand_name}. Complete the task to earn ₹${matchResult.earnings}!`,
        data: {
          shelfSpaceId: shelfSpace.id,
          emptySpaces: analysisResult.emptySpaces.length,
          campaignMatched: true,
          taskId: matchResult.taskId,
          earnings: matchResult.earnings,
          brandName: matchResult.campaign?.brand_name,
          productName: matchResult.campaign?.product_name,
        },
      };
    } catch (error) {
      logger.error('Daily workflow failed', error, {
        shopkeeperId: context.shopkeeperId,
      });
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Workflow failed. Please try again.',
      };
    }
  }
}

// Export singleton instance
export const systemCoordinator = new SystemCoordinator();
