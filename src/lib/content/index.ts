/**
 * Content Module Public API
 * Re-exports all public types and functions for content reading
 */

// Types
export type {
    Article,
    ArticleFrontmatter,
    ParsedArticle,
    ContentType,
    Section,
} from './types';

// Error classes
export {
    ContentValidationError,
    ContentParseError,
} from './types';

// Reader functions
export {
    getAllArticles,
    getArticleBySlug,
    getArticlesBySection,
    getFeaturedArticles,
    getArticlesByTag,
    getAllTags,
    getValidSections,
} from './reader';

// Parser (for advanced use cases)
export { parseMarkdown } from './parser';

// Homepage data composition
export type {
    HomepageData,
    HomepageSections,
} from './homepage';

export { getHomepageData } from './homepage';

// Section page data composition
export type {
    SectionPageData,
    SectionInfo,
} from './section';

export {
    getSectionPageData,
    InvalidSectionError,
} from './section';

// Article page data composition
export type {
    ArticlePageData,
} from './article';

export {
    getArticlePageData,
    InvalidArticleSectionError,
    ArticleNotFoundError,
    InvalidSlugError,
    SectionMismatchError,
} from './article';
