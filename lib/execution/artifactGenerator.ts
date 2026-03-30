/**
 * Execution Assistance System - Artifact Generation & Tracking
 * 
 * Generates actionable artifacts from business plans:
 * - Grant applications
 * - Partner outreach emails
 * - Financial templates
 */

export type ArtifactType = 'grant' | 'outreach' | 'financial' | 'permit' | 'pitch' | 'contract';
export type ArtifactStatus = 'not_started' | 'generated' | 'downloaded' | 'submitted' | 'completed';

export interface UserProfile {
  name: string;
  businessName: string;
  industry: string;
  location: string;
  email?: string;
  phone?: string;
  registrationNumber?: string;
  yearsInBusiness?: number;
}

export interface BusinessContext {
  businessName: string;
  businessType: string;
  industry: string;
  description: string;
  targetCustomer: string;
  revenue?: string;
  costs?: string;
  team?: string[];
  advantages?: string[];
  challenges?: string[];
}

export interface GeneratedArtifact {
  id: string;
  type: ArtifactType;
  title: string;
  content: string;
  metadata: {
    generatedAt: Date;
    userProfile: UserProfile;
    businessContext: BusinessContext;
    targetProgram?: string;
    missingInputs?: string[];
  };
  status: ArtifactStatus;
  downloadUrl?: string;
  submittedAt?: Date;
  notes?: string;
}

export interface ArtifactCompletion {
  userId: string;
  totalArtifacts: number;
  completedArtifacts: number;
  artifactsByType: Record<ArtifactType, number>;
  completionRate: number; // 0-100
  lastActivity: Date;
}

/**
 * Artifact Generation Manager
 */
export class ArtifactGenerator {
  /**
   * Generate grant application draft
   */
  static async generateGrantDraft(
    userProfile: UserProfile,
    businessContext: BusinessContext,
    grantProgram: {
      name: string;
      provider: string;
      eligibility: string;
      questions?: string[];
    }
  ): Promise<GeneratedArtifact> {
    // Validate required inputs
    const missingInputs = this.validateGrantInputs(userProfile, businessContext);

    const artifact: GeneratedArtifact = {
      id: `grant-${Date.now()}`,
      type: 'grant',
      title: `${grantProgram.name} Application Draft`,
      content: '', // Will be filled by AI prompt
      metadata: {
        generatedAt: new Date(),
        userProfile,
        businessContext,
        targetProgram: grantProgram.name,
        missingInputs,
      },
      status: missingInputs.length > 0 ? 'not_started' : 'generated',
    };

    return artifact;
  }

  /**
   * Generate partner outreach emails
   */
  static async generateOutreachEmails(
    userProfile: UserProfile,
    businessContext: BusinessContext,
    targetType: 'supplier' | 'distributor' | 'partner'
  ): Promise<GeneratedArtifact> {
    const artifact: GeneratedArtifact = {
      id: `outreach-${Date.now()}`,
      type: 'outreach',
      title: `${targetType.charAt(0).toUpperCase() + targetType.slice(1)} Outreach Templates`,
      content: '', // Will be filled by AI prompt
      metadata: {
        generatedAt: new Date(),
        userProfile,
        businessContext,
      },
      status: 'generated',
    };

    return artifact;
  }

  /**
   * Generate financial cashflow template
   */
  static async generateFinancialTemplate(
    businessContext: BusinessContext,
    assumptions: {
      monthlyRevenue?: number;
      cogs?: number;
      fixedCosts?: number;
      startingCapital?: number;
    }
  ): Promise<GeneratedArtifact> {
    const artifact: GeneratedArtifact = {
      id: `financial-${Date.now()}`,
      type: 'financial',
      title: '12-Month Cashflow Projection (JMD)',
      content: '', // Will be filled by template
      metadata: {
        generatedAt: new Date(),
        userProfile: {} as UserProfile, // Not required for financial
        businessContext,
      },
      status: 'generated',
    };

    return artifact;
  }

  /**
   * Validate required inputs for grant application
   */
  private static validateGrantInputs(
    userProfile: UserProfile,
    businessContext: BusinessContext
  ): string[] {
    const missing: string[] = [];

    // Required profile fields
    if (!userProfile.name) missing.push('Your full name');
    if (!userProfile.businessName) missing.push('Business name');
    if (!userProfile.location) missing.push('Business location in Jamaica');
    if (!userProfile.email) missing.push('Contact email');

    // Required business fields
    if (!businessContext.description) missing.push('Business description');
    if (!businessContext.targetCustomer) missing.push('Target customer profile');
    if (!businessContext.revenue) missing.push('Expected revenue/financial projections');

    // Recommended fields
    if (!userProfile.registrationNumber) {
      missing.push('Business registration number (recommended)');
    }

    return missing;
  }

  /**
   * Convert artifact to downloadable format
   */
  static exportArtifact(
    artifact: GeneratedArtifact,
    format: 'txt' | 'docx' | 'pdf' | 'csv'
  ): Blob {
    let content = artifact.content;
    let mimeType = 'text/plain';

    switch (format) {
      case 'txt':
        mimeType = 'text/plain';
        break;
      case 'docx':
        // In real implementation, use docx library
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case 'pdf':
        // In real implementation, use pdf library
        mimeType = 'application/pdf';
        break;
      case 'csv':
        mimeType = 'text/csv';
        break;
    }

    return new Blob([content], { type: mimeType });
  }
}

/**
 * Artifact Completion Tracker
 */
export class ArtifactTracker {
  private static readonly STORAGE_KEY = 'artifact_completion';

  /**
   * Track artifact generation
   */
  static trackGeneration(artifact: GeneratedArtifact, userId: string): void {
    const completion = this.getCompletion(userId);

    completion.totalArtifacts++;
    completion.artifactsByType[artifact.type] = 
      (completion.artifactsByType[artifact.type] || 0) + 1;
    completion.lastActivity = new Date();

    this.saveCompletion(userId, completion);
  }

  /**
   * Track artifact download
   */
  static trackDownload(artifactId: string, userId: string): void {
    const completion = this.getCompletion(userId);
    completion.lastActivity = new Date();
    this.saveCompletion(userId, completion);
  }

  /**
   * Track artifact submission
   */
  static trackSubmission(artifactId: string, userId: string): void {
    const completion = this.getCompletion(userId);
    completion.completedArtifacts++;
    completion.completionRate = 
      (completion.completedArtifacts / completion.totalArtifacts) * 100;
    completion.lastActivity = new Date();
    this.saveCompletion(userId, completion);
  }

  /**
   * Get user's artifact completion status
   */
  static getCompletion(userId: string): ArtifactCompletion {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}

    return {
      userId,
      totalArtifacts: 0,
      completedArtifacts: 0,
      artifactsByType: {
        grant: 0,
        outreach: 0,
        financial: 0,
        permit: 0,
        pitch: 0,
        contract: 0,
      },
      completionRate: 0,
      lastActivity: new Date(),
    };
  }

  /**
   * Save completion status
   */
  private static saveCompletion(userId: string, completion: ArtifactCompletion): void {
    try {
      localStorage.setItem(
        `${this.STORAGE_KEY}_${userId}`,
        JSON.stringify(completion)
      );
    } catch {}
  }

  /**
   * Get completion metrics across all users
   */
  static getGlobalMetrics(): {
    totalUsers: number;
    totalArtifacts: number;
    averageCompletionRate: number;
    artifactTypeDistribution: Record<ArtifactType, number>;
  } {
    // In real implementation, would query backend
    return {
      totalUsers: 0,
      totalArtifacts: 0,
      averageCompletionRate: 0,
      artifactTypeDistribution: {
        grant: 0,
        outreach: 0,
        financial: 0,
        permit: 0,
        pitch: 0,
        contract: 0,
      },
    };
  }
}

/**
 * Next Action Recommender
 */
export class NextActionRecommender {
  /**
   * Recommend next action based on business plan and artifacts
   */
  static getNextActions(
    businessContext: BusinessContext,
    existingArtifacts: GeneratedArtifact[],
    userContext: { isJamaican: boolean; hasProfile: boolean }
  ): Array<{
    action: string;
    artifactType: ArtifactType;
    priority: 'high' | 'medium' | 'low';
    reason: string;
    estimatedTime: string;
  }> {
    const actions: Array<any> = [];

    // Check what's missing
    const hasGrant = existingArtifacts.some(a => a.type === 'grant');
    const hasOutreach = existingArtifacts.some(a => a.type === 'outreach');
    const hasFinancial = existingArtifacts.some(a => a.type === 'financial');

    // High priority: Financial planning (always needed first)
    if (!hasFinancial) {
      actions.push({
        action: 'Create 12-month cashflow projection',
        artifactType: 'financial' as ArtifactType,
        priority: 'high' as const,
        reason: 'Essential for any grant application or funding conversation',
        estimatedTime: '10 minutes',
      });
    }

    // High priority: Grant application (if Jamaican)
    if (userContext.isJamaican && !hasGrant) {
      actions.push({
        action: 'Draft JBDC grant application',
        artifactType: 'grant' as ArtifactType,
        priority: 'high' as const,
        reason: 'JBDC offers grants up to JMD 2M for qualified businesses',
        estimatedTime: '15 minutes',
      });
    }

    // Medium priority: Partner outreach
    if (!hasOutreach && businessContext.businessType !== 'service') {
      actions.push({
        action: 'Create supplier outreach emails',
        artifactType: 'outreach' as ArtifactType,
        priority: 'medium' as const,
        reason: 'Start building your supply chain early',
        estimatedTime: '5 minutes',
      });
    }

    return actions;
  }

  /**
   * Calculate "confusion score" - likelihood user doesn't know what to do
   */
  static getConfusionScore(
    businessContext: BusinessContext,
    existingArtifacts: GeneratedArtifact[],
    daysSincePlanCreation: number
  ): {
    score: number; // 0-100, higher = more confused
    signals: string[];
    recommendations: string[];
  } {
    let score = 0;
    const signals: string[] = [];
    const recommendations: string[] = [];

    // Signal 1: No artifacts generated
    if (existingArtifacts.length === 0 && daysSincePlanCreation > 1) {
      score += 40;
      signals.push('No artifacts generated after creating plan');
      recommendations.push('Start with the cashflow template - it takes 10 minutes');
    }

    // Signal 2: Artifacts generated but not downloaded
    const generatedNotDownloaded = existingArtifacts.filter(
      a => a.status === 'generated'
    ).length;
    if (generatedNotDownloaded > 0) {
      score += 20;
      signals.push(`${generatedNotDownloaded} artifacts not downloaded`);
      recommendations.push('Download and review your generated documents');
    }

    // Signal 3: Long time since last activity
    if (daysSincePlanCreation > 7) {
      score += 30;
      signals.push('No activity for 7+ days');
      recommendations.push('Set aside 30 minutes to take one concrete action');
    }

    // Signal 4: Downloaded but not submitted
    const downloadedNotSubmitted = existingArtifacts.filter(
      a => a.status === 'downloaded'
    ).length;
    if (downloadedNotSubmitted > 0) {
      score += 10;
      signals.push('Documents downloaded but not used yet');
      recommendations.push('Schedule time to submit your grant application');
    }

    return {
      score: Math.min(100, score),
      signals,
      recommendations,
    };
  }
}
