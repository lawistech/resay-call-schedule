// src/app/features/ecommerce/models/product-knowledge-base.model.ts
import { ProductCatalog } from './product-catalog.model';

export type KnowledgeBaseCategory = 'technical_specs' | 'usage_scenarios' | 'faq' | 'competitive_analysis';
export type FeedbackStatus = 'pending' | 'reviewed' | 'implemented' | 'rejected';

export interface ProductKnowledgeBase {
  id: string;
  productId: string;
  product?: ProductCatalog; // For display purposes
  title: string;
  content: string;
  category: KnowledgeBaseCategory;
  tags?: string[];
  createdBy?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  // New fields for enhanced features
  averageRating?: number;
  totalRatings?: number;
  viewCount?: number;
  currentVersion?: number;
  attachments?: KnowledgeBaseAttachment[];
}

export interface CompetitiveAnalysis {
  id: string;
  knowledgeBaseId: string;
  competitorName: string;
  competitorProduct: string;
  comparisonPoints: Record<string, any>; // Structured comparison data
  strengths: string[];
  weaknesses: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface KnowledgeBaseAttachment {
  id: string;
  knowledgeBaseId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  description?: string;
  uploadedBy?: string;
  downloadCount: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface KnowledgeBaseHistory {
  id: string;
  knowledgeBaseId: string;
  productId: string;
  title: string;
  content: string;
  category: KnowledgeBaseCategory;
  tags?: string[];
  version: number;
  changedBy?: string;
  changeSummary?: string;
  createdAt?: string;
}

export interface KnowledgeBaseFeedback {
  id: string;
  knowledgeBaseId: string;
  userId?: string;
  rating?: number;
  feedbackText?: string;
  isHelpful?: boolean;
  status: FeedbackStatus;
  adminResponse?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface KnowledgeBaseAnalytics {
  id: string;
  knowledgeBaseId: string;
  userId?: string;
  action: 'view' | 'search' | 'download';
  searchTerm?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: string;
}

export interface KnowledgeBaseRating {
  knowledgeBaseId: string;
  totalRatings: number;
  averageRating: number;
  helpfulCount: number;
  notHelpfulCount: number;
}

// Helper interfaces for UI organization
export interface KnowledgeBaseSection {
  title: string;
  entries: ProductKnowledgeBase[];
}

export interface ProductKnowledgeBaseComplete {
  product: ProductCatalog;
  technicalSpecs: ProductKnowledgeBase[];
  usageScenarios: ProductKnowledgeBase[];
  faqs: ProductKnowledgeBase[];
  competitiveAnalysis: {
    entries: ProductKnowledgeBase[];
    details: CompetitiveAnalysis[];
  };
  // New fields for enhanced features
  attachments: KnowledgeBaseAttachment[];
  ratings: KnowledgeBaseRating[];
  popularEntries: ProductKnowledgeBase[];
}
